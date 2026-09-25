package com.gymlife.repository;

import com.gymlife.model.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MembershipRepository extends JpaRepository<Membership, Long> {
    List<Membership> findByUsuarioIdUsuario(Long usuarioId);
}
