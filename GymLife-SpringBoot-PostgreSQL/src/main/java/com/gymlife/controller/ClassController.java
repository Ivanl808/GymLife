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
    public ResponseEntity<GroupClass> reservar(
            @PathVariable Long claseId,
            @PathVariable Long usuarioId) {
        return ResponseEntity.ok(service.reservar(claseId, usuarioId));
    }

    @PostMapping("/{claseId}/asistencia/{usuarioId}")
    public ResponseEntity<Attendance> asistencia(
            @PathVariable Long claseId,
            @PathVariable Long usuarioId,
            @RequestParam String codigoQR) {
        return ResponseEntity.ok(
                service.registrarAsistencia(claseId, usuarioId, codigoQR));
    }

    @GetMapping("/asistencias/usuario/{usuarioId}")
    public ResponseEntity<List<Attendance>> listarAsistencias(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(service.asistenciasPorUsuario(usuarioId));
    }
}
