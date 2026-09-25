package com.gymlife.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "clases_grupales")
public class GroupClass {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idClase;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private LocalDateTime horario;

    @Column(nullable = false)
    private Integer cupoMaximo = 15;

    @ManyToMany
    @JoinTable(
        name = "reservas",
        joinColumns = @JoinColumn(name = "clase_id"),
        inverseJoinColumns = @JoinColumn(name = "usuario_id")
    )
    private List<User> usuarios = new ArrayList<>();

    public GroupClass() {
    }

    public GroupClass(Long idClase, String nombre, LocalDateTime horario, Integer cupoMaximo, List<User> usuarios) {
        this.idClase = idClase;
        this.nombre = nombre;
        this.horario = horario;
        this.cupoMaximo = cupoMaximo != null ? cupoMaximo : 15;
        this.usuarios = usuarios != null ? usuarios : new ArrayList<>();
    }

    public Long getIdClase() {
        return idClase;
    }

    public void setIdClase(Long idClase) {
        this.idClase = idClase;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public LocalDateTime getHorario() {
        return horario;
    }

    public void setHorario(LocalDateTime horario) {
        this.horario = horario;
    }

    public Integer getCupoMaximo() {
        return cupoMaximo;
    }

    public void setCupoMaximo(Integer cupoMaximo) {
        this.cupoMaximo = cupoMaximo;
    }

    public List<User> getUsuarios() {
        return usuarios;
    }

    public void setUsuarios(List<User> usuarios) {
        this.usuarios = usuarios;
    }

    public boolean tieneCupo() {
        return usuarios != null && usuarios.size() < (cupoMaximo != null ? cupoMaximo : 15);
    }

    public static GroupClassBuilder builder() {
        return new GroupClassBuilder();
    }

    public static class GroupClassBuilder {
        private Long idClase;
        private String nombre;
        private LocalDateTime horario;
        private Integer cupoMaximo = 15;
        private List<User> usuarios = new ArrayList<>();

        GroupClassBuilder() {
        }

        public GroupClassBuilder idClase(Long idClase) {
            this.idClase = idClase;
            return this;
        }

        public GroupClassBuilder nombre(String nombre) {
            this.nombre = nombre;
            return this;
        }

        public GroupClassBuilder horario(LocalDateTime horario) {
            this.horario = horario;
            return this;
        }

        public GroupClassBuilder cupoMaximo(Integer cupoMaximo) {
            this.cupoMaximo = cupoMaximo;
            return this;
        }

        public GroupClassBuilder usuarios(List<User> usuarios) {
            this.usuarios = usuarios;
            return this;
        }

        public GroupClass build() {
            return new GroupClass(idClase, nombre, horario, cupoMaximo, usuarios);
        }
    }
}
