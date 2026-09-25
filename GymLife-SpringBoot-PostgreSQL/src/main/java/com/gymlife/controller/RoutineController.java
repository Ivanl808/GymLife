package com.gymlife.controller;

import com.gymlife.model.Routine;
import com.gymlife.model.User;
import com.gymlife.repository.RoutineRepository;
import com.gymlife.repository.UserRepository;
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

    public RoutineController(RoutineRepository routines,
                             UserRepository users) {
        this.routines = routines;
        this.users = users;
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

        return ResponseEntity.ok(routines.save(routine));
    }

    @GetMapping("/miembro/{miembroId}")
    public ResponseEntity<?> listar(@PathVariable Long miembroId) {
        return ResponseEntity.ok(
                routines.findByMiembroIdUsuario(miembroId));
    }
}
