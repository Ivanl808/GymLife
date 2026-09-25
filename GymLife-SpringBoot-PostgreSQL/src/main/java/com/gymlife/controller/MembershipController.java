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
    public ResponseEntity<Payment> pagar(
            @PathVariable Long membershipId,
            @RequestBody Payment payment) {
        return ResponseEntity.ok(service.registrarPago(membershipId, payment));
    }
}
