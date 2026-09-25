package com.gymlife.model;

import jakarta.persistence.*;

@Entity
@Table(name = "rutinas")
public class Routine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idRutina;

    @Column(nullable = false)
    private String nombre;

    private String nivel;
    private Integer duracion;

    @ManyToOne(optional = false)
    @JoinColumn(name = "entrenador_id")
    private User entrenador;

    @ManyToOne(optional = false)
    @JoinColumn(name = "miembro_id")
    private User miembro;

    public Routine() {
    }

    public Routine(Long idRutina, String nombre, String nivel, Integer duracion, User entrenador, User miembro) {
        this.idRutina = idRutina;
        this.nombre = nombre;
        this.nivel = nivel;
        this.duracion = duracion;
        this.entrenador = entrenador;
        this.miembro = miembro;
    }

    public Long getIdRutina() {
        return idRutina;
    }

    public void setIdRutina(Long idRutina) {
        this.idRutina = idRutina;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getNivel() {
        return nivel;
    }

    public void setNivel(String nivel) {
        this.nivel = nivel;
    }

    public Integer getDuracion() {
        return duracion;
    }

    public void setDuracion(Integer duracion) {
        this.duracion = duracion;
    }

    public User getEntrenador() {
        return entrenador;
    }

    public void setEntrenador(User entrenador) {
        this.entrenador = entrenador;
    }

    public User getMiembro() {
        return miembro;
    }

    public void setMiembro(User miembro) {
        this.miembro = miembro;
    }

    public static RoutineBuilder builder() {
        return new RoutineBuilder();
    }

    public static class RoutineBuilder {
        private Long idRutina;
        private String nombre;
        private String nivel;
        private Integer duracion;
        private User entrenador;
        private User miembro;

        RoutineBuilder() {
        }

        public RoutineBuilder idRutina(Long idRutina) {
            this.idRutina = idRutina;
            return this;
        }

        public RoutineBuilder nombre(String nombre) {
            this.nombre = nombre;
            return this;
        }

        public RoutineBuilder nivel(String nivel) {
            this.nivel = nivel;
            return this;
        }

        public RoutineBuilder duracion(Integer duracion) {
            this.duracion = duracion;
            return this;
        }

        public RoutineBuilder entrenador(User entrenador) {
            this.entrenador = entrenador;
            return this;
        }

        public RoutineBuilder miembro(User miembro) {
            this.miembro = miembro;
            return this;
        }

        public Routine build() {
            return new Routine(idRutina, nombre, nivel, duracion, entrenador, miembro);
        }
    }
}
