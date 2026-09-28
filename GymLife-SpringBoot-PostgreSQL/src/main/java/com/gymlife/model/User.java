package com.gymlife.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "usuarios")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUsuario;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role rol;

    @Column(name = "qr_token", unique = true, nullable = false, length = 64)
    private String qrToken;

    public User() {
        this.qrToken = UUID.randomUUID().toString();
    }

    public User(Long idUsuario, String nombre, String email, String passwordHash, Role rol, String qrToken) {
        this.idUsuario = idUsuario;
        this.nombre = nombre;
        this.email = email;
        this.passwordHash = passwordHash;
        this.rol = rol;
        this.qrToken = qrToken != null ? qrToken : UUID.randomUUID().toString();
    }

    @PrePersist
    public void ensureQrToken() {
        if (this.qrToken == null || this.qrToken.isBlank()) {
            this.qrToken = UUID.randomUUID().toString();
        }
    }

    public Long getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Long idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRol() {
        return rol;
    }

    public void setRol(Role rol) {
        this.rol = rol;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private Long idUsuario;
        private String nombre;
        private String email;
        private String passwordHash;
        private Role rol;
        private String qrToken;

        UserBuilder() {
        }

        public UserBuilder idUsuario(Long idUsuario) {
            this.idUsuario = idUsuario;
            return this;
        }

        public UserBuilder nombre(String nombre) {
            this.nombre = nombre;
            return this;
        }

        public UserBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserBuilder passwordHash(String passwordHash) {
            this.passwordHash = passwordHash;
            return this;
        }

        public UserBuilder rol(Role rol) {
            this.rol = rol;
            return this;
        }

        public UserBuilder qrToken(String qrToken) {
            this.qrToken = qrToken;
            return this;
        }

        public User build() {
            return new User(idUsuario, nombre, email, passwordHash, rol, qrToken);
        }
    }
}
