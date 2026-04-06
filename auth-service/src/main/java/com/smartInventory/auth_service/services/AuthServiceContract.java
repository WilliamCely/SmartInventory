package com.smartInventory.auth_service.services;

import com.smartInventory.auth_service.dto.auth.AuthLoginRequest;
import com.smartInventory.auth_service.dto.auth.AuthLoginResponse;

public interface AuthServiceContract {
    AuthLoginResponse login(AuthLoginRequest request);
}