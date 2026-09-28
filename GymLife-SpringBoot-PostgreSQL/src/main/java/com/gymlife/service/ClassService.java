package com.gymlife.service;

import com.gymlife.model.*;
import com.gymlife.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ClassService {
    private final GroupClassRepository classes;
    private final UserRepository users;
    private final AttendanceRepository attendance;
    private final EmailService emailService;

    public ClassService(GroupClassRepository classes,
                        UserRepository users,
                        AttendanceRepository attendance,
                        EmailService emailService) {
        this.classes = classes;
        this.users = users;
        this.attendance = attendance;
        this.emailService = emailService;
    }

    public GroupClass crear(GroupClass c) {
        if (c.getCupoMaximo() == null || c.getCupoMaximo() <= 0) {
            c.setCupoMaximo(15);
        }
        return classes.save(c);
    }

    public List<GroupClass> listar() {
        return classes.findAll();
    }

    public List<Attendance> asistenciasPorUsuario(Long usuarioId) {
        return attendance.findByUsuarioIdUsuario(usuarioId);
    }

    public GroupClass reservar(Long claseId, Long usuarioId) {
        GroupClass c = classes.findById(claseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clase no encontrada"));
        User u = users.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        if (!c.tieneCupo()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La clase está llena.");
        }

        if (c.getUsuarios() != null && c.getUsuarios().stream()
                .anyMatch(x -> x.getIdUsuario() != null && x.getIdUsuario().equals(usuarioId))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ya tienes una reserva confirmada en esta clase.");
        }

        // Validación de Empalme de Horarios (Conflicto de Agendamiento)
        if (c.getHorario() != null) {
            List<GroupClass> todasLasClases = classes.findAll();
            boolean conflictoHorario = todasLasClases.stream()
                .filter(otraClase -> !otraClase.getIdClase().equals(claseId))
                .filter(otraClase -> otraClase.getHorario() != null && otraClase.getHorario().equals(c.getHorario()))
                .anyMatch(otraClase -> otraClase.getUsuarios() != null && otraClase.getUsuarios().stream()
                    .anyMatch(x -> x.getIdUsuario() != null && x.getIdUsuario().equals(usuarioId)));

            if (conflictoHorario) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ya tienes otra clase reservada a la misma fecha y hora (" + c.getHorario().toString().replace("T", " ") + "). No puedes asistir a dos clases simultáneamente.");
            }
        }

        if (c.getUsuarios() == null) {
            c.setUsuarios(new java.util.ArrayList<>());
        }

        c.getUsuarios().add(u);
        GroupClass savedClass = classes.save(c);

        // Envío de correo electrónico con horario de la clase reservada
        try {
            String horarioStr = c.getHorario() != null ? c.getHorario().toString().replace("T", " ") : "Programado";
            emailService.enviarCorreoReservaClase(u.getEmail(), u.getNombre(), c.getNombre(), horarioStr);
        } catch (Exception e) {
            System.err.println("Error al enviar correo de reserva: " + e.getMessage());
        }

        return savedClass;
    }

    public Attendance registrarAsistencia(Long claseId,
                                          Long usuarioId,
                                          String codigoQR) {
        GroupClass c = classes.findById(claseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clase no encontrada"));
        User u = users.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        boolean reservado = c.getUsuarios() != null && c.getUsuarios().stream()
                .anyMatch(x -> x.getIdUsuario() != null && x.getIdUsuario().equals(usuarioId));

        if (!reservado) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Para registrar asistencia a esta clase primero debes tener un cupo reservado.");
        }

        Attendance a = Attendance.builder()
                .fecha(LocalDateTime.now())
                .codigoQR(codigoQR)
                .usuario(u)
                .clase(c)
                .build();

        return attendance.save(a);
    }
}
