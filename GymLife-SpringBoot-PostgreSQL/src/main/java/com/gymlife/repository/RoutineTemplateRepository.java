package com.gymlife.repository;

import com.gymlife.model.RoutineTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoutineTemplateRepository extends JpaRepository<RoutineTemplate, Long> {
    List<RoutineTemplate> findByEntrenadorIdUsuario(Long entrenadorId);
}
