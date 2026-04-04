package com.smartInventory.auth_service.dto.auth;

public record AuthLoginResponse(
        String accessToken,
        String tokenType,
        AuthUserResponse user
) {
}
