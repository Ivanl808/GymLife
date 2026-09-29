package com.gymlife.controller;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gymlife.model.Attendance;
import com.gymlife.model.User;
import com.gymlife.repository.AttendanceRepository;
import com.gymlife.service.UserService;

import jakarta.validation.Valid;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/usuarios")
public class UserController {
    private final UserService service;
    private final AttendanceRepository attendanceRepository;
    private final com.gymlife.repository.GroupClassRepository groupClassRepository;

    @Value("${gymlife.app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Value("${gymlife.turnstile.cooldown-minutes:15}")
    private long cooldownMinutes;

    public UserController(UserService service, 
                          AttendanceRepository attendanceRepository,
                          com.gymlife.repository.GroupClassRepository groupClassRepository) {
        this.service = service;
        this.attendanceRepository = attendanceRepository;
        this.groupClassRepository = groupClassRepository;
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

        return ResponseEntity.ok(Map.of(
            "valido", true,
            "usuarioId", user.getIdUsuario(),
            "nombre", user.getNombre(),
            "email", user.getEmail(),
            "rol", user.getRol(),
            "qrToken", user.getQrToken()
        ));
    }

    @PostMapping("/registrar-entrada-torniquete/{qrToken}")
    public ResponseEntity<?> registrarEntradaTorniquete(@PathVariable String qrToken) {
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

        // Auto Check-In Inteligente para Clases del Día del Socio
        String claseAutoCheckIn = null;
        try {
            List<com.gymlife.model.GroupClass> todasLasClases = groupClassRepository.findAll();
            for (com.gymlife.model.GroupClass c : todasLasClases) {
                if (c.getUsuarios() != null && c.getUsuarios().stream().anyMatch(u -> u.getIdUsuario().equals(user.getIdUsuario()))) {
                    // Si el socio está reservado y tiene clase hoy/proximamente
                    claseAutoCheckIn = c.getNombre();
                    Attendance asistenciaClase = Attendance.builder()
                        .fecha(LocalDateTime.now())
                        .codigoQR("GYMLIFE-PASS-" + user.getQrToken())
                        .usuario(user)
                        .clase(c)
                        .build();
                    attendanceRepository.save(asistenciaClase);
                    break;
                }
            }
        } catch (Exception e) {
            System.err.println("Error en Auto Check-In de clase: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
            "valido", true,
            "usuarioId", user.getIdUsuario(),
            "nombre", user.getNombre(),
            "email", user.getEmail(),
            "rol", user.getRol(),
            "horaEntrada", LocalDateTime.now().toString(),
            "claseAutoConfirmada", claseAutoCheckIn != null ? claseAutoCheckIn : ""
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
