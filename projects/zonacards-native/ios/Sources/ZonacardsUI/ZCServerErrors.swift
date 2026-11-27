import Observation
import SwiftUI

/// Errores de validación que devuelve el servidor, por campo (equivale a `applyServerErrors` y `focusFirstInvalid` de la web, y a `validationErrors`
/// del formulario de HeroUI). Declara los campos en el orden de la pantalla; cada campo lee su mensaje con `error(_:)`, recibe `focusRequest(_:)` y se
/// limpia cuando la persona lo edita (`binding(_:_:)`):
///
/// ```swift
/// @State private var server = ZCServerErrors(fields: ["email", "nombre"])
/// ZCTextField("Correo", text: server.binding("email", $email), error: server.error("email") ?? localError, focusRequest: server.focusRequest("email"))
/// // al responder el servidor con 422:
/// let general = server.apply(["email": "Ya existe una cuenta con este correo.", "cuenta": "Cuenta suspendida"])
/// ```
/// `apply` lleva el foco al primer campo con error y devuelve las claves que no son de ningún campo (un error general): muéstralas en un `ZCAlert`.
@Observable
public final class ZCServerErrors {
    private let fields: [String]
    private var messages: [String: String] = [:]
    private var focusCounts: [String: Int] = [:]

    public init(fields: [String]) { self.fields = fields }

    /// El mensaje del servidor para el campo, o `nil`.
    public func error(_ field: String) -> String? { messages[field] }

    /// Hay algún error del servidor sin resolver.
    public var hasErrors: Bool { !messages.isEmpty }

    /// El primer campo con error, en el orden declarado.
    public var firstInvalid: String? { fields.first { messages[$0] != nil } }

    /// Para `ZCTextField(focusRequest:)`: cuando sube, el campo toma el foco.
    public func focusRequest(_ field: String) -> Int { focusCounts[field] ?? 0 }

    /// Borra el error de un campo (la persona lo editó).
    public func clear(_ field: String) { messages[field] = nil }

    /// Borra todos (antes de volver a enviar).
    public func clearAll() { messages = [:] }

    /// El texto de un campo que borra su error del servidor al cambiar: `ZCTextField("Correo", text: server.binding("email", $email))`.
    public func binding(_ field: String, _ text: Binding<String>) -> Binding<String> {
        Binding(get: { text.wrappedValue }, set: { [self] new in
            text.wrappedValue = new
            clear(field)
        })
    }

    /// Pone los mensajes en sus campos y lleva el foco al primero con error (según el orden declarado). Los mensajes vacíos se ignoran.
    /// Devuelve las claves que no corresponden a ningún campo declarado.
    @discardableResult
    public func apply(_ errors: [String: String?], focus: Bool = true) -> [String] {
        var unmatched: [String] = []
        for (field, message) in errors {
            guard let message, !message.isEmpty else { continue }
            if fields.contains(field) { messages[field] = message } else { unmatched.append(field) }
        }
        if focus, let first = firstInvalid { focusCounts[first, default: 0] += 1 }
        return unmatched.sorted()
    }
}
