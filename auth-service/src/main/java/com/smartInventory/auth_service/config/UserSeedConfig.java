package com.smartInventory.auth_service.config;

import com.smartInventory.auth_service.models.RolUsuario;
import com.smartInventory.auth_service.models.Usuario;
import com.smartInventory.auth_service.repositories.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class UserSeedConfig {

    @Bean
    CommandLineRunner seedUsers(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            upsertUser(usuarioRepository, passwordEncoder, "admin", "admin123", RolUsuario.ADMIN);
            upsertUser(usuarioRepository, passwordEncoder, "bodeguero", "bodega123", RolUsuario.BODEGUERO);
        };
    }

    private void upsertUser(
            UsuarioRepository repository,
            PasswordEncoder encoder,
            String username,
            String rawPassword,
            RolUsuario role
    ) {
        Usuario user = repository.findByUsername(username)
                .orElse(Usuario.builder().username(username).rol(role).build());

        user.setRol(role);
        user.setPasswordHash(encoder.encode(rawPassword));
        repository.save(user);
    }
}
