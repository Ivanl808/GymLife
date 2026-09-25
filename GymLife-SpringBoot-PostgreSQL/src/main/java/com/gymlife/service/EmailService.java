package com.gymlife.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:gymlife@gmail.com}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Envía un correo HTML estilizado de Bienvenida con el Pase Digital Código QR incrustado
     */
    @Async
    public void enviarCorreoBienvenida(String destinatario, String nombreUsuario, Long idUsuario) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(destinatario);
            helper.setSubject("¡Bienvenido/a a GymLife! Tu Pase Digital QR está Listo");

            String qrCodeText = "GYMLIFE-PASS-USER-" + idUsuario;
            String qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + qrCodeText;

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px;">
                    <div style="max-width: 500px; margin: 0 auto; background-color: #1e293b; padding: 30px; border-radius: 20px; border: 1px solid #334155; text-align: center;">
                        <h2 style="color: #10b981; margin-bottom: 5px;">¡Bienvenido/a, %s!</h2>
                        <p style="color: #94a3b8; font-size: 14px;">Tu cuenta en GymLife Platform ha sido creada exitosamente.</p>
                        
                        <div style="background-color: #0f172a; padding: 20px; border-radius: 15px; margin: 20px 0;">
                            <h3 style="color: #ffffff; font-size: 16px; margin-top: 0;">Tu Pase Digital de Acceso</h3>
                            <img src="%s" alt="Código QR de Acceso" style="width: 180px; height: 180px; border-radius: 10px; background: white; padding: 10px;"/>
                            <p style="font-family: monospace; color: #10b981; font-weight: bold; margin-top: 10px;">%s</p>
                        </div>

                        <p style="color: #cbd5e1; font-size: 13px;">Muestra este código QR en la recepción o en los torniquetes para ingresar a nuestras instalaciones.</p>
                        <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;">
                        <p style="color: #64748b; font-size: 11px;">GymLife Fitness Platform &copy; 2026</p>
                    </div>
                </body>
                </html>
                """.formatted(nombreUsuario, qrImageUrl, qrCodeText);

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Error al enviar correo de bienvenida: " + e.getMessage());
        }
    }

    /**
     * Envía correo de confirmación de reserva de clase
     */
    @Async
    public void enviarCorreoReservaClase(String destinatario, String nombreUsuario, String nombreClase, String horario) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(destinatario);
            helper.setSubject("Confirmación de Reserva - " + nombreClase);

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px;">
                    <div style="max-width: 500px; margin: 0 auto; background-color: #1e293b; padding: 30px; border-radius: 20px; border: 1px solid #334155;">
                        <h2 style="color: #10b981;">Reserva Confirmada</h2>
                        <p style="color: #e2e8f0; font-size: 14px;">Hola <strong>%s</strong>, tu cupo ha sido reservado correctamente.</p>
                        
                        <div style="background-color: #0f172a; padding: 15px; border-radius: 12px; border-left: 4px solid #10b981; margin: 20px 0;">
                            <p style="margin: 5px 0; color: #ffffff; font-weight: bold;">Clase: %s</p>
                            <p style="margin: 5px 0; color: #94a3b8; font-size: 13px;">Horario: %s</p>
                        </div>

                        <p style="color: #cbd5e1; font-size: 12px;">Recuerda presentar tu Pase QR al ingresar a la sala.</p>
                    </div>
                </body>
                </html>
                """.formatted(nombreUsuario, nombreClase, horario);

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Error al enviar correo de reserva: " + e.getMessage());
        }
    }

    /**
     * Envía correo de confirmación cuando se registra un pago de membresía
     */
    @Async
    public void enviarCorreoPagoConfirmado(String destinatario, String nombreUsuario, String tipoMembresia, String monto) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(destinatario);
            helper.setSubject("Comprobante de Pago de Membresía - GymLife");

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px;">
                    <div style="max-width: 500px; margin: 0 auto; background-color: #1e293b; padding: 30px; border-radius: 20px; border: 1px solid #334155;">
                        <h2 style="color: #10b981;">Pago Recibido Exitosamente</h2>
                        <p style="color: #e2e8f0; font-size: 14px;">Hola <strong>%s</strong>, hemos registrado tu pago correctamente.</p>
                        
                        <div style="background-color: #0f172a; padding: 15px; border-radius: 12px; margin: 20px 0;">
                            <p style="margin: 5px 0; color: #94a3b8; font-size: 13px;">Plan: <strong style="color: #ffffff;">%s</strong></p>
                            <p style="margin: 5px 0; color: #94a3b8; font-size: 13px;">Monto Pagado: <strong style="color: #10b981; font-size: 16px;">$%s</strong></p>
                        </div>

                        <p style="color: #cbd5e1; font-size: 12px;">Tu membresía se encuentra ACTIVA. ¡A entrenar con todo!</p>
                    </div>
                </body>
                </html>
                """.formatted(nombreUsuario, tipoMembresia, monto);

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Error al enviar correo de pago: " + e.getMessage());
        }
    }
}
