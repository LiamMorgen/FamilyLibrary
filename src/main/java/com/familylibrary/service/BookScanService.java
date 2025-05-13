package com.familylibrary.service;

import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
public class BookScanService {

    @Value("${google.books.api.key}")
    private String googleBooksApiKey;

    private final RestTemplate restTemplate;

    public BookScanService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> scanBook(MultipartFile image) throws IOException {
        // 1. 使用 Google Cloud Vision API 进行文本识别
        String text = detectText(image);

        // 2. 从识别的文本中提取 ISBN
        String isbn = extractIsbn(text);

        // 3. 使用 ISBN 查询 Google Books API
        if (isbn != null) {
            Map<String, Object> result = fetchBookInfo(isbn);
            if (result != null) {
                return result;
            }
        }

        // 4. 如果没有找到 ISBN，尝试使用书名搜索
        String title = extractTitle(text);
        if (title != null) {
            Map<String, Object> result = searchBookByTitle(title);
            if (result != null) {
                return result;
            }
        }

        throw new IOException("无法识别图书信息");
    }

    private String detectText(MultipartFile image) throws IOException {
        try (ImageAnnotatorClient client = ImageAnnotatorClient.create()) {
            ByteString imgBytes = ByteString.copyFrom(image.getBytes());
            Image img = Image.newBuilder().setContent(imgBytes).build();
            Feature feat = Feature.newBuilder().setType(Feature.Type.TEXT_DETECTION).build();
            AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                    .addFeatures(feat)
                    .setImage(img)
                    .build();
            BatchAnnotateImagesResponse response = client.batchAnnotateImages(Collections.singletonList(request));
            AnnotateImageResponse result = response.getResponses(0);

            if (result.hasError()) {
                throw new IOException("Error detecting text: " + result.getError().getMessage());
            }

            return result.getFullTextAnnotation().getText();
        }
    }

    private String extractIsbn(String text) {
        // 使用正则表达式匹配 ISBN 格式
        // ISBN-10: 0-7475-3269-9
        // ISBN-13: 978-0-7475-3269-9
        String isbnPattern = "\\b(?:ISBN[- ]?)?(?:(?:97[89])[- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]\\b";
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(isbnPattern);
        java.util.regex.Matcher matcher = pattern.matcher(text);
        
        if (matcher.find()) {
            return matcher.group().replaceAll("[^0-9X]", "");
        }
        return null;
    }

    private String extractTitle(String text) {
        // 简单的启发式方法：假设第一行是标题
        String[] lines = text.split("\\n");
        if (lines.length > 0) {
            return lines[0].trim();
        }
        return null;
    }

    private Map<String, Object> fetchBookInfo(String isbn) {
        String url = String.format("https://www.googleapis.com/books/v1/volumes?q=isbn:%s&key=%s", 
            isbn, googleBooksApiKey);
        
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        
        if (response != null && response.containsKey("items") && ((List<?>) response.get("items")).size() > 0) {
            Map<String, Object> bookInfo = (Map<String, Object>) ((List<?>) response.get("items")).get(0);
            Map<String, Object> volumeInfo = (Map<String, Object>) bookInfo.get("volumeInfo");
            
            Map<String, Object> result = new HashMap<>();
            result.put("title", volumeInfo.get("title"));
            result.put("authors", volumeInfo.get("authors"));
            result.put("publisher", volumeInfo.get("publisher"));
            result.put("publishedDate", volumeInfo.get("publishedDate"));
            result.put("description", volumeInfo.get("description"));
            result.put("isbn", isbn);
            result.put("imageUrl", volumeInfo.get("imageLinks") != null ? 
                ((Map<String, Object>) volumeInfo.get("imageLinks")).get("thumbnail") : null);
            
            return result;
        }
        
        return null;
    }

    private Map<String, Object> searchBookByTitle(String title) {
        String url = String.format("https://www.googleapis.com/books/v1/volumes?q=intitle:%s&key=%s", 
            title, googleBooksApiKey);
        
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        
        if (response != null && response.containsKey("items") && ((List<?>) response.get("items")).size() > 0) {
            Map<String, Object> bookInfo = (Map<String, Object>) ((List<?>) response.get("items")).get(0);
            Map<String, Object> volumeInfo = (Map<String, Object>) bookInfo.get("volumeInfo");
            
            Map<String, Object> result = new HashMap<>();
            result.put("title", volumeInfo.get("title"));
            result.put("authors", volumeInfo.get("authors"));
            result.put("publisher", volumeInfo.get("publisher"));
            result.put("publishedDate", volumeInfo.get("publishedDate"));
            result.put("description", volumeInfo.get("description"));
            result.put("isbn", extractIsbnFromIndustryIdentifiers(volumeInfo));
            result.put("imageUrl", volumeInfo.get("imageLinks") != null ? 
                ((Map<String, Object>) volumeInfo.get("imageLinks")).get("thumbnail") : null);
            
            return result;
        }
        
        return null;
    }

    private String extractIsbnFromIndustryIdentifiers(Map<String, Object> volumeInfo) {
        if (volumeInfo.containsKey("industryIdentifiers")) {
            List<Map<String, Object>> identifiers = (List<Map<String, Object>>) volumeInfo.get("industryIdentifiers");
            for (Map<String, Object> identifier : identifiers) {
                String type = (String) identifier.get("type");
                if ("ISBN_13".equals(type)) {
                    return (String) identifier.get("identifier");
                }
            }
        }
        return null;
    }
} 