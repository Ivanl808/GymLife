package com.gymlife.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "membresias")
public class Membership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMembresia;

    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private LocalDate fechaInicio;

    @Column(nullable = false)
    private LocalDate fechaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MembershipStatus estado;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id")
    private User usuario;

    public Membership() {
    }

    public Membership(Long idMembresia, String tipo, LocalDate fechaInicio, LocalDate fechaFin, MembershipStatus estado, User usuario) {
        this.idMembresia = idMembresia;
        this.tipo = tipo;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.estado = estado;
        this.usuario = usuario;
    }

    public Long getIdMembresia() {
        return idMembresia;
    }

    public void setIdMembresia(Long idMembresia) {
        this.idMembresia = idMembresia;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDate fechaFin) {
        this.fechaFin = fechaFin;
    }

    public MembershipStatus getEstado() {
        return estado;
    }

    public void setEstado(MembershipStatus estado) {
        this.estado = estado;
    }

    public User getUsuario() {
        return usuario;
    }

    public void setUsuario(User usuario) {
        this.usuario = usuario;
    }

    public boolean verificarVigencia() {
        return estado == MembershipStatus.ACTIVA &&
               fechaFin != null && !LocalDate.now().isAfter(fechaFin);
    }

    public void renovar(LocalDate nuevaFechaFin) {
        this.fechaFin = nuevaFechaFin;
        this.estado = MembershipStatus.ACTIVA;
    }

    public static MembershipBuilder builder() {
        return new MembershipBuilder();
    }

    public static class MembershipBuilder {
        private Long idMembresia;
        private String tipo;
        private LocalDate fechaInicio;
        private LocalDate fechaFin;
        private MembershipStatus estado;
        private User usuario;

        MembershipBuilder() {
        }

        public MembershipBuilder idMembresia(Long idMembresia) {
            this.idMembresia = idMembresia;
            return this;
        }

        public MembershipBuilder tipo(String tipo) {
            this.tipo = tipo;
            return this;
        }

        public MembershipBuilder fechaInicio(LocalDate fechaInicio) {
            this.fechaInicio = fechaInicio;
            return this;
        }

        public MembershipBuilder fechaFin(LocalDate fechaFin) {
            this.fechaFin = fechaFin;
            return this;
        }

        public MembershipBuilder estado(MembershipStatus estado) {
            this.estado = estado;
            return this;
        }

        public MembershipBuilder usuario(User usuario) {
            this.usuario = usuario;
            return this;
        }

        public Membership build() {
            return new Membership(idMembresia, tipo, fechaInicio, fechaFin, estado, usuario);
        }
    }
}
