package com.familylibrary.config;

import com.familylibrary.service.UserDetailsServiceImpl;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.UnsupportedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtRequestFilter extends OncePerRequestFilter {

    private static final Logger filterLogger = LoggerFactory.getLogger(JwtRequestFilter.class);

    private final UserDetailsServiceImpl userDetailsServiceImpl;
    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");
        String jwtToken = null;
        String username = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwtToken = authorizationHeader.substring(7);
            filterLogger.debug("Extracted JWT: {}", jwtToken);
            try {
                username = jwtUtil.extractUsername(jwtToken);
                filterLogger.debug("Username extracted from JWT: {}", username);
            } catch (IllegalArgumentException e) {
                filterLogger.warn("Unable to get JWT Token (IllegalArgumentException): {}", e.getMessage());
            } catch (ExpiredJwtException e) {
                filterLogger.warn("JWT Token has expired for subject: {}", e.getClaims().getSubject());
            } catch (SignatureException e) {
                filterLogger.warn("JWT signature validation failed: {}", e.getMessage());
            } catch (MalformedJwtException e) {
                filterLogger.warn("JWT token is malformed: {}", e.getMessage());
            } catch (UnsupportedJwtException e) {
                filterLogger.warn("JWT token is unsupported: {}", e.getMessage());
            } catch (JwtException e) {
                filterLogger.warn("JWT processing error: {}", e.getMessage());
            } catch (Exception e) {
                filterLogger.error("Unexpected error during JWT username extraction", e);
            }
        } else {
            filterLogger.trace("Authorization header does not exist or does not start with Bearer: {}", request.getRequestURI());
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            filterLogger.debug("SecurityContext is null, attempting to authenticate user: {}", username);
            UserDetails userDetails = null;
            try {
                userDetails = this.userDetailsServiceImpl.loadUserByUsername(username);
            } catch (Exception e) {
                filterLogger.warn("Error loading user details for {}: {}", username, e.getMessage());
            }

            if (userDetails != null) {
                filterLogger.debug("Validating token for user: {}", userDetails.getUsername());
                try {
                    if (jwtUtil.validateToken(jwtToken, userDetails)) {
                        filterLogger.info("JWT token validated successfully for user: {}", username);
                        UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        usernamePasswordAuthenticationToken
                                .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
                        filterLogger.debug("User {} authenticated and SecurityContext updated.", username);
                    } else {
                        filterLogger.warn("JWT token validation failed for user: {}", username);
                    }
                } catch (Exception e) {
                    filterLogger.error("Error during token validation for user {}: {}", username, e.getMessage(), e);
                }
            } else {
                filterLogger.warn("User details not found for username from token: {}", username);
            }
        } else if (username == null && jwtToken != null) {
            filterLogger.warn("JWT present but username could not be extracted. Token: {}", jwtToken);
        }

        chain.doFilter(request, response);
    }
} 