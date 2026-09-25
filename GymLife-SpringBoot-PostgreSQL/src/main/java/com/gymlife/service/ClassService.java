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

    public ClassService(GroupClassRepository classes,
                        UserRepository users,
                        AttendanceRepository attendance) {
        this.classes = classes;
        this.users = users;
        this.attendance = attendance;
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

    public GroupClass reservar(Long claseId, Long usuarioId) {
        GroupClass c = classes.findById(claseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clase no encontrada"));
        User u = users.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        if (!c.tieneCupo()) {
            throw new IllegalStateException(
                    "La clase está llena. Se requiere lista de espera.");
        }

        if (c.getUsuarios() != null && c.getUsuarios().stream()
                .anyMatch(x -> x.getIdUsuario() != null && x.getIdUsuario().equals(usuarioId))) {
            throw new IllegalStateException("El miembro ya tiene una reserva.");
        }

        c.getUsuarios().add(u);
        return classes.save(c);
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
            throw new IllegalStateException(
                    "El usuario no tiene reserva en esta clase.");
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
