package com.gymlife.controller;

import com.gymlife.model.RoutineTemplate;
import com.gymlife.model.User;
import com.gymlife.repository.RoutineTemplateRepository;
import com.gymlife.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/plantillas-rutinas")
public class RoutineTemplateController {
    private final RoutineTemplateRepository templates;
    private final UserRepository users;

    public RoutineTemplateController(RoutineTemplateRepository templates, UserRepository users) {
        this.templates = templates;
        this.users = users;
    }

    @GetMapping("/entrenador/{entrenadorId}")
    public ResponseEntity<?> listarPorEntrenador(@PathVariable Long entrenadorId) {
        return ResponseEntity.ok(templates.findByEntrenadorIdUsuario(entrenadorId));
    }

    @PostMapping("/entrenador/{entrenadorId}")
    public ResponseEntity<RoutineTemplate> guardarPlantilla(
            @PathVariable Long entrenadorId,
            @RequestBody RoutineTemplate template) {

        User entrenador = users.findById(entrenadorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrenador no encontrado"));

        template.setEntrenador(entrenador);
        return ResponseEntity.ok(templates.save(template));
    }

    @DeleteMapping("/{plantillaId}")
    public ResponseEntity<?> eliminarPlantilla(@PathVariable Long plantillaId) {
        RoutineTemplate t = templates.findById(plantillaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plantilla no encontrada"));
        templates.delete(t);
        return ResponseEntity.ok(java.util.Map.of("mensaje", "Plantilla eliminada correctamente"));
    }
}
