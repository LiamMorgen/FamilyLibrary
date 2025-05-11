package com.familylibrary.service;

import com.familylibrary.dto.*;
import com.familylibrary.model.Book;
import com.familylibrary.model.User;
import com.familylibrary.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DeepSeekService {

    @Value("${deepseek.api.key}")
    private String deepSeekApiKey;

    @Value("${deepseek.api.url:https://api.deepseek.com/chat/completions}")
    private String deepSeekApiUrl;

    private final RestTemplate restTemplate;
    private final BookRepository bookRepository; // To fetch user's books
    private final UserService userService; // To get current user

    @Autowired
    public DeepSeekService(RestTemplate restTemplate, BookRepository bookRepository, UserService userService) {
        this.restTemplate = restTemplate;
        this.bookRepository = bookRepository;
        this.userService = userService;
    }

    private DeepSeekChatResponseDto callDeepSeekAPI(List<DeepSeekMessageDto> messages) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(deepSeekApiKey);

        DeepSeekChatRequestDto requestDto = new DeepSeekChatRequestDto();
        requestDto.setModel("deepseek-chat"); // Or your preferred model
        requestDto.setMessages(messages);
        // Set other parameters like temperature, max_tokens if needed
        // requestDto.setTemperature(0.7);
        // requestDto.setMax_tokens(1024);

        HttpEntity<DeepSeekChatRequestDto> entity = new HttpEntity<>(requestDto, headers);

        try {
            return restTemplate.exchange(deepSeekApiUrl, HttpMethod.POST, entity, DeepSeekChatResponseDto.class).getBody();
        } catch (Exception e) {
            // Log error e.g., using SLF4J logger
            System.err.println("Error calling DeepSeek API: " + e.getMessage());
            // Consider throwing a custom exception or returning a specific error DTO
            return null;
        }
    }

    public InitialAIAnalysisResponseDto getInitialAnalysisForCurrentUser() {
        User currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            // Handle case where user is not found or not authenticated
            return null; 
        }

        List<Book> userBooks = bookRepository.findByAddedById(currentUser.getId());
        if (userBooks.isEmpty()) {
            InitialAIAnalysisResponseDto emptyResponse = new InitialAIAnalysisResponseDto();
            emptyResponse.setAnalysisText("您的书架上还没有书籍，无法进行分析和推荐。请先添加一些书籍。");
            emptyResponse.setRecommendedBooks(new ArrayList<>());
            return emptyResponse;
        }

        String bookListString = userBooks.stream()
                                .map(book -> book.getTitle() + " (作者: " + book.getAuthor() + ", 分类: " + (book.getCategory() != null ? book.getCategory() : "未知") + ")")
                                .collect(Collectors.joining("\n"));

        List<DeepSeekMessageDto> messages = new ArrayList<>();
        messages.add(new DeepSeekMessageDto("system", "你是一位资深、友好、温暖的图书推荐和阅读分析专家。用户会提供他们的书单，请你简要地概括用户的阅读品味、个人性格，语言尽量高级凝练，富有内涵和文采，并据此推荐2-3本用户可能会喜欢的书籍。请在回复开始时先对用户的阅读偏好进行一段总结性分析，然后以列表形式推荐书籍，每本书籍包括书名、作者和简短的推荐理由。推荐的书籍不要与用户书单中的书籍重复。"));
        messages.add(new DeepSeekMessageDto("user", "我的书单如下：\n" + bookListString + "\n\n请根据以上书单进行分析和推荐。"));

        DeepSeekChatResponseDto deepSeekResponse = callDeepSeekAPI(messages);

        if (deepSeekResponse != null && deepSeekResponse.getChoices() != null && !deepSeekResponse.getChoices().isEmpty()) {
            String rawAnalysis = deepSeekResponse.getChoices().get(0).getMessage().getContent();
            // Basic parsing attempt (can be significantly improved with more robust parsing or if DeepSeek offers structured output)
            InitialAIAnalysisResponseDto response = new InitialAIAnalysisResponseDto();
            response.setAnalysisText(rawAnalysis); // For now, set the full response as analysis
            
            // TODO: Implement more sophisticated parsing to extract structured recommendations
            // This is a placeholder and will likely need adjustment based on actual API response format
            List<BookRecommendationDto> recommendations = parseRecommendations(rawAnalysis, userBooks);
            response.setRecommendedBooks(recommendations);
            return response;
        } else {
            InitialAIAnalysisResponseDto errorResponse = new InitialAIAnalysisResponseDto();
            errorResponse.setAnalysisText("抱歉，AI分析服务暂时不可用，请稍后再试。");
            errorResponse.setRecommendedBooks(new ArrayList<>());
            return errorResponse;
        }
    }

    // Placeholder for parsing recommendations from raw text
    // This needs to be implemented based on how DeepSeek structures its response.
    private List<BookRecommendationDto> parseRecommendations(String rawText, List<Book> existingBooks) {
        List<BookRecommendationDto> recommendations = new ArrayList<>();
        // Example: Look for lines starting with "书名：", "作者：", "推荐理由："
        // This is highly dependent on the AI's output format and may require regex or other NLP techniques.
        // For simplicity, this example won't perform complex parsing.
        // It's better if the AI can be prompted to provide a JSON or structured list directly.

        String[] lines = rawText.split("\n");
        BookRecommendationDto currentRecommendation = null;

        for (String line : lines) {
            line = line.trim();
            if (line.startsWith("书名：") || line.startsWith("书名:")) {
                if (currentRecommendation != null && currentRecommendation.getTitle() != null && !isBookAlreadyInList(currentRecommendation.getTitle(), existingBooks)) {
                    recommendations.add(currentRecommendation);
                }
                currentRecommendation = new BookRecommendationDto();
                currentRecommendation.setTitle(line.substring(line.indexOf(":") + 1).trim());
            } else if (currentRecommendation != null && (line.startsWith("作者：") || line.startsWith("作者:"))) {
                currentRecommendation.setAuthor(line.substring(line.indexOf(":") + 1).trim());
            } else if (currentRecommendation != null && (line.startsWith("推荐理由：") || line.startsWith("推荐理由:"))) {
                currentRecommendation.setReason(line.substring(line.indexOf(":") + 1).trim());
            }
        }
        // Add the last recommendation if it exists and is not a duplicate
        if (currentRecommendation != null && currentRecommendation.getTitle() != null && currentRecommendation.getAuthor() != null && currentRecommendation.getReason() != null && !isBookAlreadyInList(currentRecommendation.getTitle(), existingBooks)) {
            recommendations.add(currentRecommendation);
        }
        
        // Limit to 5 recommendations
        if (recommendations.size() > 5) {
            return recommendations.subList(0, 5);
        }
        return recommendations;
    }
    
    private boolean isBookAlreadyInList(String title, List<Book> existingBooks) {
        if (title == null) return false;
        return existingBooks.stream().anyMatch(book -> title.equalsIgnoreCase(book.getTitle()));
    }

    public DeepSeekMessageDto getAIChatResponse(AIQueryDto queryDto) {
        User currentUser = userService.getCurrentUser();
        String userIdentifier = (currentUser != null) ? "用户 " + currentUser.getUsername() : "用户";

        List<DeepSeekMessageDto> messages = new ArrayList<>();
        messages.add(new DeepSeekMessageDto("system", "你是一位友好的AI阅读助手。请根据用户的提问进行回答。如果用户提到书籍，你可以结合上下文提供相关的书籍信息或推荐。"));
        
        if (queryDto.getHistory() != null && !queryDto.getHistory().isEmpty()) {
            messages.addAll(queryDto.getHistory());
        }
        messages.add(new DeepSeekMessageDto("user", queryDto.getQuery()));

        DeepSeekChatResponseDto deepSeekResponse = callDeepSeekAPI(messages);

        if (deepSeekResponse != null && deepSeekResponse.getChoices() != null && !deepSeekResponse.getChoices().isEmpty()) {
            return deepSeekResponse.getChoices().get(0).getMessage();
        } else {
            return new DeepSeekMessageDto("assistant", "抱歉，AI服务暂时遇到问题，请稍后再试。");
        }
    }
} 