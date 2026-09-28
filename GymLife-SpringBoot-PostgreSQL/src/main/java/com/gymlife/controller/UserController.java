package com.gymlife.controller;

import com.gymlife.model.Attendance;
import com.gymlife.model.User;
import com.gymlife.repository.AttendanceRepository;
import com.gymlife.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/usuarios")
public class UserController {
    private final UserService service;
    private final AttendanceRepository attendanceRepository;

    @Value("${gymlife.app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Value("${gymlife.turnstile.cooldown-minutes:15}")
    private long cooldownMinutes;

    public UserController(UserService service, AttendanceRepository attendanceRepository) {
        this.service = service;
        this.attendanceRepository = attendanceRepository;
    }

    @PostMapping("/registro")
    public ResponseEntity<User> registrar(@Valid @RequestBody User user) {
        return ResponseEntity.ok(service.registrar(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> request) {

        try {
            User user = service.autenticar(
                    request.get("email"),
                    request.get("password"));

            return ResponseEntity.ok(Map.of(
                    "mensaje", "Autenticación correcta",
                    "usuarioId", user.getIdUsuario(),
                    "nombre", user.getNombre(),
                    "rol", user.getRol(),
                    "qrToken", user.getQrToken()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "mensaje", e.getMessage() != null ? e.getMessage() : "Credenciales incorrectas. Verifique correo y contraseña.",
                    "error", "Credenciales incorrectas"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "mensaje", "Correo o contraseña incorrectos",
                    "error", "Credenciales incorrectas"
            ));
        }
    }

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @GetMapping("/config/info")
    public ResponseEntity<?> getConfigInfo() {
        return ResponseEntity.ok(Map.of(
            "baseUrl", baseUrl
        ));
    }

    @GetMapping("/validar-qr/{qrToken}")
    public ResponseEntity<?> validarQr(@PathVariable String qrToken) {
        String cleanToken = qrToken.startsWith("GYMLIFE-PASS-") 
            ? qrToken.substring("GYMLIFE-PASS-".length()) 
            : qrToken;
            
        User user = service.buscarPorQrToken(cleanToken);

        // Si es ADMINISTRADOR o ENTRENADOR, concede acceso STAFF VIP de forma permanente
        if (user.getRol() == com.gymlife.model.Role.ADMINISTRADOR || user.getRol() == com.gymlife.model.Role.ENTRENADOR) {
            // Verificación Anti-Passback también para Staff
            Optional<Attendance> ultimaAsistenciaOpt = attendanceRepository.findTopByUsuarioIdUsuarioOrderByFechaDesc(user.getIdUsuario());
            if (ultimaAsistenciaOpt.isPresent()) {
                LocalDateTime ultimaEntrada = ultimaAsistenciaOpt.get().getFecha();
                long minutosTranscurridos = Duration.between(ultimaEntrada, LocalDateTime.now()).toMinutes();
                if (minutosTranscurridos < cooldownMinutes) {
                    long minutosRestantes = cooldownMinutes - minutosTranscurridos;
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "valido", false,
                        "bloqueadoPorAntiPassback", true,
                        "minutosRestantes", minutosRestantes,
                        "mensaje", "Código recién utilizado. Favor de esperar " + minutosRestantes + " minuto(s) para ingresar nuevamente.",
                        "nombre", user.getNombre(),
                        "email", user.getEmail()
                    ));
                }
            }

            // Registrar asistencia de Staff
            Attendance asistenciaStaff = Attendance.builder()
                .fecha(LocalDateTime.now())
                .codigoQR("GYMLIFE-PASS-" + user.getQrToken())
                .usuario(user)
                .clase(null)
                .build();
            attendanceRepository.save(asistenciaStaff);

            return ResponseEntity.ok(Map.of(
                "valido", true,
                "usuarioId", user.getIdUsuario(),
                "nombre", user.getNombre(),
                "email", user.getEmail(),
                "rol", user.getRol(),
                "esStaff", true,
                "horaEntrada", LocalDateTime.now().toString()
            ));
        }

        // Verificación Anti-Passback
        Optional<Attendance> ultimaAsistenciaOpt = attendanceRepository.findTopByUsuarioIdUsuarioOrderByFechaDesc(user.getIdUsuario());
        if (ultimaAsistenciaOpt.isPresent()) {
            LocalDateTime ultimaEntrada = ultimaAsistenciaOpt.get().getFecha();
            long minutosTranscurridos = Duration.between(ultimaEntrada, LocalDateTime.now()).toMinutes();
            
            if (minutosTranscurridos < cooldownMinutes) {
                long minutosRestantes = cooldownMinutes - minutosTranscurridos;
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "valido", false,
                    "bloqueadoPorAntiPassback", true,
                    "minutosRestantes", minutosRestantes,
                    "mensaje", "Código recién utilizado. Favor de esperar " + minutosRestantes + " minuto(s) para ingresar nuevamente.",
                    "nombre", user.getNombre(),
                    "email", user.getEmail()
                ));
            }
        }

        // Registrar nueva asistencia de torniquete en MySQL
        Attendance nuevaAsistencia = Attendance.builder()
            .fecha(LocalDateTime.now())
            .codigoQR("GYMLIFE-PASS-" + user.getQrToken())
            .usuario(user)
            .clase(null)
            .build();
            
        attendanceRepository.save(nuevaAsistencia);

        return ResponseEntity.ok(Map.of(
            "valido", true,
            "usuarioId", user.getIdUsuario(),
            "nombre", user.getNombre(),
            "email", user.getEmail(),
            "rol", user.getRol(),
            "horaEntrada", LocalDateTime.now().toString()
        ));
    }

    @PostMapping("/{idUsuario}/regenerar-qr")
    public ResponseEntity<?> regenerarQr(@PathVariable Long idUsuario) {
        User user = service.regenerarQrToken(idUsuario);
        return ResponseEntity.ok(Map.of(
            "mensaje", "Nuevo código QR generado y enviado por correo exitosamente",
            "nuevoQrToken", user.getQrToken()
        ));
    }
}
