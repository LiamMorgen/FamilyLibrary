package com.familylibrary.service;

import com.familylibrary.model.User;
import com.familylibrary.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList; // For authorities, if you add roles later

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // For now, we return a UserDetails object with an empty list of authorities (roles/permissions).
        // Later, if you add roles to your User entity, you would map them to GrantedAuthority objects here.
        // For example: List<GrantedAuthority> authorities = user.getRoles().stream()
        //                                                       .map(role -> new SimpleGrantedAuthority(role.getName()))
        //                                                       .collect(Collectors.toList());
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(), // This should be the encoded password from the database
                new ArrayList<>() // Empty authorities list for now
        );
    }
} 