package com.gymlife.controller;

import com.gymlife.model.*;
import com.gymlife.service.MembershipService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/membresias")
public class MembershipController {
    private final MembershipService service;

    public MembershipController(MembershipService service) {
        this.service = service;
    }

    @PostMapping("/usuario/{usuarioId}")
    public ResponseEntity<Membership> crear(
            @PathVariable Long usuarioId,
            @RequestBody Membership membership) {
        return ResponseEntity.ok(service.crear(usuarioId, membership));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> listar(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(service.porUsuario(usuarioId));
    }

    @PostMapping("/{membershipId}/pagos")
    public ResponseEntity<?> pagar(
            @PathVariable Long membershipId,
            @RequestBody Payment payment) {
        try {
            return ResponseEntity.ok(service.registrarPago(membershipId, payment));
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(java.util.Map.of(
                "mensaje", e.getReason() != null ? e.getReason() : "Error en el registro del pago",
                "message", e.getReason() != null ? e.getReason() : "Error en el registro del pago"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "mensaje", e.getMessage() != null ? e.getMessage() : "Error en el registro del pago",
                "message", e.getMessage() != null ? e.getMessage() : "Error en the registro del pago"
            ));
        }
    }
}
