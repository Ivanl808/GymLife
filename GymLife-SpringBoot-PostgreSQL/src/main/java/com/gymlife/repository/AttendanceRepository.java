package com.gymlife.repository;

import com.gymlife.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByUsuarioIdUsuario(Long usuarioId);
    Optional<Attendance> findTopByUsuarioIdUsuarioOrderByFechaDesc(Long usuarioId);
}
