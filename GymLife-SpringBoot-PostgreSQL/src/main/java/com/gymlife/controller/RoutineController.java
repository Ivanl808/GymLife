package com.gymlife.controller;

import com.gymlife.model.Routine;
import com.gymlife.model.User;
import com.gymlife.repository.RoutineRepository;
import com.gymlife.repository.UserRepository;
import com.gymlife.service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/rutinas")
public class RoutineController {
    private final RoutineRepository routines;
    private final UserRepository users;
    private final EmailService emailService;

    public RoutineController(RoutineRepository routines,
                             UserRepository users,
                             EmailService emailService) {
        this.routines = routines;
        this.users = users;
        this.emailService = emailService;
    }

    @GetMapping
    public ResponseEntity<?> listarTodas() {
        return ResponseEntity.ok(routines.findAll());
    }

    @PostMapping("/entrenador/{entrenadorId}/miembro/{miembroId}")
    public ResponseEntity<Routine> crear(
            @PathVariable Long entrenadorId,
            @PathVariable Long miembroId,
            @RequestBody Routine routine) {

        User entrenador = users.findById(entrenadorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrenador no encontrado"));
        User miembro = users.findById(miembroId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Miembro no encontrado"));

        routine.setEntrenador(entrenador);
        routine.setMiembro(miembro);

        Routine savedRoutine = routines.save(routine);

        // Notificar por correo al Socio
        try {
            emailService.enviarCorreoRutinaAsignada(
                miembro.getEmail(),
                miembro.getNombre(),
                savedRoutine.getNombre(),
                savedRoutine.getNivel(),
                savedRoutine.getDuracion(),
                entrenador.getNombre(),
                savedRoutine.getObjetivo(),
                savedRoutine.getInstrucciones()
            );
        } catch (Exception e) {
            System.err.println("Error enviando correo de rutina: " + e.getMessage());
        }

        return ResponseEntity.ok(savedRoutine);
    }

    @GetMapping("/miembro/{miembroId}")
    public ResponseEntity<?> listar(@PathVariable Long miembroId) {
        return ResponseEntity.ok(
                routines.findByMiembroIdUsuario(miembroId));
    }

    @GetMapping("/entrenador/{entrenadorId}")
    public ResponseEntity<?> listarPorEntrenador(@PathVariable Long entrenadorId) {
        return ResponseEntity.ok(
                routines.findByEntrenadorIdUsuario(entrenadorId));
    }
}
