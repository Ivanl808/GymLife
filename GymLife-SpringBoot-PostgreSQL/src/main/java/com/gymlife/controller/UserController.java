package com.gymlife.controller;

import com.gymlife.model.User;
import com.gymlife.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/usuarios")
public class UserController {
    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @PostMapping("/registro")
    public ResponseEntity<User> registrar(@Valid @RequestBody User user) {
        return ResponseEntity.ok(service.registrar(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> request) {

        User user = service.autenticar(
                request.get("email"),
                request.get("password"));

        return ResponseEntity.ok(Map.of(
                "mensaje", "Autenticación correcta",
                "usuarioId", user.getIdUsuario(),
                "nombre", user.getNombre(),
                "rol", user.getRol()
        ));
    }

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(service.listar());
    }
}
