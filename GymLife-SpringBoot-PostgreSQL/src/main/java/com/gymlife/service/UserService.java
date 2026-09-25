package com.gymlife.service;

import com.gymlife.model.Role;
import com.gymlife.model.User;
import com.gymlife.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserService {
    private final UserRepository repository;
    private final BCryptPasswordEncoder encoder;

    public UserService(UserRepository repository, BCryptPasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    public User registrar(User user) {
        if (repository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }
        user.setPasswordHash(encoder.encode(user.getPasswordHash()));
        if (user.getRol() == null) {
            user.setRol(Role.MIEMBRO);
        }
        return repository.save(user);
    }

    public User autenticar(String email, String password) {
        User user = repository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Credenciales incorrectas"));

        if (!encoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Credenciales incorrectas");
        }

        return user;
    }

    public List<User> listar() {
        return repository.findAll();
    }
}
