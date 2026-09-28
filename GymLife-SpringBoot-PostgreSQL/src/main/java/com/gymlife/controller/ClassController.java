package com.gymlife.controller;

import com.gymlife.model.*;
import com.gymlife.service.ClassService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/clases")
public class ClassController {
    private final ClassService service;

    public ClassController(ClassService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<GroupClass> crear(@RequestBody GroupClass c) {
        return ResponseEntity.ok(service.crear(c));
    }

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @PostMapping("/{claseId}/reservar/{usuarioId}")
    public ResponseEntity<?> reservar(
            @PathVariable Long claseId,
            @PathVariable Long usuarioId) {
        try {
            return ResponseEntity.ok(service.reservar(claseId, usuarioId));
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(java.util.Map.of(
                "mensaje", e.getReason() != null ? e.getReason() : "Error en la reserva",
                "message", e.getReason() != null ? e.getReason() : "Error en la reserva"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "mensaje", e.getMessage() != null ? e.getMessage() : "Error en la reserva",
                "message", e.getMessage() != null ? e.getMessage() : "Error en la reserva"
            ));
        }
    }

    @PostMapping("/{claseId}/asistencia/{usuarioId}")
    public ResponseEntity<?> asistencia(
            @PathVariable Long claseId,
            @PathVariable Long usuarioId,
            @RequestParam String codigoQR) {
        try {
            return ResponseEntity.ok(
                    service.registrarAsistencia(claseId, usuarioId, codigoQR));
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(java.util.Map.of(
                "mensaje", e.getReason() != null ? e.getReason() : "Error al registrar asistencia",
                "message", e.getReason() != null ? e.getReason() : "Error al registrar asistencia"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "mensaje", e.getMessage() != null ? e.getMessage() : "Error al registrar asistencia",
                "message", e.getMessage() != null ? e.getMessage() : "Error al registrar asistencia"
            ));
        }
    }

    @GetMapping("/asistencias/usuario/{usuarioId}")
    public ResponseEntity<List<Attendance>> listarAsistencias(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(service.asistenciasPorUsuario(usuarioId));
    }
}
