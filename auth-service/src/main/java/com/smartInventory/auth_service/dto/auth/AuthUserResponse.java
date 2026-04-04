package com.smartInventory.auth_service.dto.auth;

public record AuthUserResponse(
        Long id,
        String username,
        String role
) {
}
