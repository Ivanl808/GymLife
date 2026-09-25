package com.gymlife.repository;

import com.gymlife.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByUsuarioIdUsuario(Long usuarioId);
}
