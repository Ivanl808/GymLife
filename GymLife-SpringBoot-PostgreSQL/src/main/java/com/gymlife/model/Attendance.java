package com.gymlife.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "asistencias")
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idAsistencia;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(nullable = false)
    private String codigoQR;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id")
    private User usuario;

    @ManyToOne(optional = false)
    @JoinColumn(name = "clase_id")
    private GroupClass clase;

    public Attendance() {
    }

    public Attendance(Long idAsistencia, LocalDateTime fecha, String codigoQR, User usuario, GroupClass clase) {
        this.idAsistencia = idAsistencia;
        this.fecha = fecha;
        this.codigoQR = codigoQR;
        this.usuario = usuario;
        this.clase = clase;
    }

    public Long getIdAsistencia() {
        return idAsistencia;
    }

    public void setIdAsistencia(Long idAsistencia) {
        this.idAsistencia = idAsistencia;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public String getCodigoQR() {
        return codigoQR;
    }

    public void setCodigoQR(String codigoQR) {
        this.codigoQR = codigoQR;
    }

    public User getUsuario() {
        return usuario;
    }

    public void setUsuario(User usuario) {
        this.usuario = usuario;
    }

    public GroupClass getClase() {
        return clase;
    }

    public void setClase(GroupClass clase) {
        this.clase = clase;
    }

    public static AttendanceBuilder builder() {
        return new AttendanceBuilder();
    }

    public static class AttendanceBuilder {
        private Long idAsistencia;
        private LocalDateTime fecha;
        private String codigoQR;
        private User usuario;
        private GroupClass clase;

        AttendanceBuilder() {
        }

        public AttendanceBuilder idAsistencia(Long idAsistencia) {
            this.idAsistencia = idAsistencia;
            return this;
        }

        public AttendanceBuilder fecha(LocalDateTime fecha) {
            this.fecha = fecha;
            return this;
        }

        public AttendanceBuilder codigoQR(String codigoQR) {
            this.codigoQR = codigoQR;
            return this;
        }

        public AttendanceBuilder usuario(User usuario) {
            this.usuario = usuario;
            return this;
        }

        public AttendanceBuilder clase(GroupClass clase) {
            this.clase = clase;
            return this;
        }

        public Attendance build() {
            return new Attendance(idAsistencia, fecha, codigoQR, usuario, clase);
        }
    }
}
