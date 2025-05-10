package com.familylibrary.config; // 确保这个包名和您创建的文件夹路径一致

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 优先处理 /assets/** 下的静态资源
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/")
                .setCachePeriod(3600) // 可选：缓存1小时
                .resourceChain(true)
                .addResolver(new PathResourceResolver());

        // Fallback 处理器，用于处理所有其他路径 (包括 / 和 SPA 路由)
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/") // 注意：这里指向 /static/ 目录
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location /* location 现在是 classpath:/static/ */) throws IOException {
                        // 排除 API, Spring Security 路径, 以及应该由 /assets/** 处理器处理的路径
                        if (resourcePath.startsWith("api/") || resourcePath.startsWith("/api/") ||
                            resourcePath.startsWith("assets/") || resourcePath.startsWith("/assets/") || // 理论上会被第一个handler捕获
                            resourcePath.equals("login") || resourcePath.equals("/login") ||
                            resourcePath.equals("logout") || resourcePath.equals("/logout") ||
                            resourcePath.equals("error") || resourcePath.equals("/error") ||
                            // 如果是其他明确的静态文件类型请求，尝试从 /static/ 直接提供
                            // 如果找不到，则返回 null，让 Spring MVC 默认处理或报404
                            resourcePath.matches(".*\\.(css|js|json|html|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$")
                           ) {
                            // 尝试从 location (classpath:/static/) 解析这些特定路径
                            Resource specificResource = location.createRelative(resourcePath);
                            return specificResource.exists() && specificResource.isReadable() ? specificResource : null;
                        }

                        // 对于所有其他路径 (例如 /, /some-spa-route), 提供 index.html
                        // location 是 classpath:/static/，我们从中创建 index.html 的相对路径
                        Resource indexHtml = location.createRelative("index.html");
                        return indexHtml.exists() && indexHtml.isReadable() ? indexHtml : null;
                    }
                });
    }
}