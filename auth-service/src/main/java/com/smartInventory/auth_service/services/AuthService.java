package com.smartInventory.auth_service.services;

import com.smartInventory.auth_service.dto.auth.AuthLoginRequest;
import com.smartInventory.auth_service.dto.auth.AuthLoginResponse;
import com.smartInventory.auth_service.dto.auth.AuthUserResponse;
import com.smartInventory.auth_service.models.Usuario;
import com.smartInventory.auth_service.repositories.UsuarioRepository;
import com.smartInventory.auth_service.security.JwtTokenService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService implements AuthServiceContract {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
                JwtTokenService jwtService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Override
    public AuthLoginResponse login(AuthLoginRequest request) {
        Usuario user = usuarioRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas"));

        if (!passwordMatches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
        }

        String token = jwtService.generateToken(user.getUsername(), user.getRol().name());
        AuthUserResponse userResponse = new AuthUserResponse(user.getId(), user.getUsername(), user.getRol().name());
        return new AuthLoginResponse(token, "Bearer", userResponse);
    }

    private boolean passwordMatches(String raw, String storedHash) {
        if (storedHash == null || storedHash.isBlank()) {
            return false;
        }

        try {
            if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
                return passwordEncoder.matches(raw, storedHash);
            }
        } catch (Exception ignored) {
            // Keeps compatibility with historical non-bcrypt values.
        }
        return raw.equals(storedHash);
    }
}
