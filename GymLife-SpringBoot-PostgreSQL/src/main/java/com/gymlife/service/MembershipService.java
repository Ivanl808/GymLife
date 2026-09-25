package com.gymlife.service;

import com.gymlife.model.*;
import com.gymlife.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MembershipService {
    private final MembershipRepository memberships;
    private final UserRepository users;
    private final PaymentRepository payments;

    public MembershipService(MembershipRepository memberships,
                             UserRepository users,
                             PaymentRepository payments) {
        this.memberships = memberships;
        this.users = users;
        this.payments = payments;
    }

    public Membership crear(Long usuarioId, Membership membership) {
        User user = users.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        membership.setUsuario(user);
        membership.setEstado(MembershipStatus.ACTIVA);
        return memberships.save(membership);
    }

    public List<Membership> porUsuario(Long usuarioId) {
        return memberships.findByUsuarioIdUsuario(usuarioId);
    }

    public Payment registrarPago(Long membershipId, Payment payment) {
        Membership m = memberships.findById(membershipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membresía no encontrada"));
        payment.setMembresia(m);
        payment.setFecha(LocalDateTime.now());
        m.setEstado(MembershipStatus.ACTIVA);
        memberships.save(m);
        return payments.save(payment);
    }

    public void actualizarVencidas() {
        memberships.findAll().forEach(m -> {
            if (m.getFechaFin() != null && m.getFechaFin().isBefore(LocalDate.now())
                    && m.getEstado() == MembershipStatus.ACTIVA) {
                m.setEstado(MembershipStatus.VENCIDA);
                memberships.save(m);
            }
        });
    }
}
