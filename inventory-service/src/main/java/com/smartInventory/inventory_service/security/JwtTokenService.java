package com.smartInventory.inventory_service.security;

public interface JwtTokenService {
    String extractUsername(String token);

    String extractRole(String token);

    boolean isTokenValid(String token);
}