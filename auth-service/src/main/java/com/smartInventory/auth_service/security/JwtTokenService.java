package com.smartInventory.auth_service.security;

public interface JwtTokenService {
    String generateToken(String username, String role);
}