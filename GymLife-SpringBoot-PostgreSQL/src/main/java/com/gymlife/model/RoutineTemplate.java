package com.gymlife.model;

import jakarta.persistence.*;

@Entity
@Table(name = "plantillas_rutinas")
public class RoutineTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPlantilla;

    @Column(nullable = false)
    private String nombre;

    private String objetivo;
    private String nivel;
    private Integer duracion;
    private String frecuencia;

    @Column(length = 2000)
    private String instrucciones;

    @ManyToOne(optional = false)
    @JoinColumn(name = "entrenador_id")
    private User entrenador;

    public RoutineTemplate() {
    }

    public RoutineTemplate(Long idPlantilla, String nombre, String objetivo, String nivel, Integer duracion, String frecuencia, String instrucciones, User entrenador) {
        this.idPlantilla = idPlantilla;
        this.nombre = nombre;
        this.objetivo = objetivo;
        this.nivel = nivel;
        this.duracion = duracion;
        this.frecuencia = frecuencia;
        this.instrucciones = instrucciones;
        this.entrenador = entrenador;
    }

    public Long getIdPlantilla() {
        return idPlantilla;
    }

    public void setIdPlantilla(Long idPlantilla) {
        this.idPlantilla = idPlantilla;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getObjetivo() {
        return objetivo;
    }

    public void setObjetivo(String objetivo) {
        this.objetivo = objetivo;
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

    public String getFrecuencia() {
        return frecuencia;
    }

    public void setFrecuencia(String frecuencia) {
        this.frecuencia = frecuencia;
    }

    public String getInstrucciones() {
        return instrucciones;
    }

    public void setInstrucciones(String instrucciones) {
        this.instrucciones = instrucciones;
    }

    public User getEntrenador() {
        return entrenador;
    }

    public void setEntrenador(User entrenador) {
        this.entrenador = entrenador;
    }
}
