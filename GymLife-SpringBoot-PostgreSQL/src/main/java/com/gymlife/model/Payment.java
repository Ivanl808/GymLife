package com.gymlife.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pagos")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPago;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod metodoPago;

    @ManyToOne(optional = false)
    @JoinColumn(name = "membresia_id")
    private Membership membresia;

    public Payment() {
    }

    public Payment(Long idPago, BigDecimal monto, LocalDateTime fecha, PaymentMethod metodoPago, Membership membresia) {
        this.idPago = idPago;
        this.monto = monto;
        this.fecha = fecha;
        this.metodoPago = metodoPago;
        this.membresia = membresia;
    }

    public Long getIdPago() {
        return idPago;
    }

    public void setIdPago(Long idPago) {
        this.idPago = idPago;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public PaymentMethod getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(PaymentMethod metodoPago) {
        this.metodoPago = metodoPago;
    }

    public Membership getMembresia() {
        return membresia;
    }

    public void setMembresia(Membership membresia) {
        this.membresia = membresia;
    }

    public static PaymentBuilder builder() {
        return new PaymentBuilder();
    }

    public static class PaymentBuilder {
        private Long idPago;
        private BigDecimal monto;
        private LocalDateTime fecha;
        private PaymentMethod metodoPago;
        private Membership membresia;

        PaymentBuilder() {
        }

        public PaymentBuilder idPago(Long idPago) {
            this.idPago = idPago;
            return this;
        }

        public PaymentBuilder monto(BigDecimal monto) {
            this.monto = monto;
            return this;
        }

        public PaymentBuilder fecha(LocalDateTime fecha) {
            this.fecha = fecha;
            return this;
        }

        public PaymentBuilder metodoPago(PaymentMethod metodoPago) {
            this.metodoPago = metodoPago;
            return this;
        }

        public PaymentBuilder membresia(Membership membresia) {
            this.membresia = membresia;
            return this;
        }

        public Payment build() {
            return new Payment(idPago, monto, fecha, metodoPago, membresia);
        }
    }
}
