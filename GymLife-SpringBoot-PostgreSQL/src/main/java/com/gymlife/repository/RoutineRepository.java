package com.gymlife.repository;

import com.gymlife.model.Routine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoutineRepository extends JpaRepository<Routine, Long> {
    List<Routine> findByMiembroIdUsuario(Long miembroId);
}
