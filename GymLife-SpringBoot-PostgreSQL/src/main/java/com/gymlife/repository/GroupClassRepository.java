package com.gymlife.repository;

import com.gymlife.model.GroupClass;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface GroupClassRepository extends JpaRepository<GroupClass, Long> {
    List<GroupClass> findByHorarioBetween(LocalDateTime inicio, LocalDateTime fin);
}
