import SwiftUI
import ZonacardsTokens
import ZonacardsUI

/// Formularios: todos los campos de la ola 1 con sus estados (ayuda, error, obligatorio, deshabilitado) y los de dominio por país.
struct FormsSection: View {
    @State private var name = ""
    @State private var email = "ana@"
    @State private var password = ""
    @State private var zip = ""
    @State private var notes = ""
    @State private var query = ""
    @State private var city: String? = nil
    @State private var tags: Set<String> = ["vip"]
    @State private var date = "2026-11-21"
    @State private var amount: Double? = 1250
    @State private var country = "pe"
    @State private var phone = "987654321"
    @State private var dialCountry = "pe"
    @State private var taxId = "20123456789"
    @State private var otp = "123"
    @State private var seats = 3

    private let cities = [ZCOption("lim", label: "Lima"), ZCOption("cus", label: "Cusco", description: "Altura"), ZCOption("aqp", label: "Arequipa"), ZCOption("tru", label: "Trujillo", enabled: false)]
    private let tagOptions = ["vip", "nuevo", "mayorista", "online"].map { ZCOption($0, label: $0.capitalized) }
    private let countries = [ZCOption("pe", label: "Perú"), ZCOption("co", label: "Colombia"), ZCOption("cl", label: "Chile"), ZCOption("mx", label: "México")]

    var body: some View {
        VStack(alignment: .leading, spacing: ZCSpace.v8) {
            group("Texto") {
                ZCTextField("Nombre", text: $name, placeholder: "Ej. Lucía Mendoza", hint: "Como figura en tu documento", required: true)
                ZCTextField("Correo", text: $email, placeholder: "nombre@empresa.com", error: "Ingresa un correo válido, ej. ana@empresa.com.", keyboard: .emailAddress, capitalization: .never)
                ZCTextField("Contraseña", text: $password, password: true, submitLabel: .done)
                ZCTextField("Cupón", text: .constant("BLOQUEADO"), hint: "No editable").disabled(true)
                ZCTextField("Código postal", text: $zip, allowed: "\\d", rejectMessage: "Solo se aceptan números.", maxLength: 5, showCounter: true)
                ZCTextArea("Notas", text: $notes, hint: "Opcional", optional: true, maxLength: 200)
                ZCSearchField(query: $query, placeholder: "Buscar lotes")
            }
            group("Selección") {
                ZCSelect("Ciudad", options: cities, selection: $city, required: true)
                ZCMultiSelect("Etiquetas", options: tagOptions, selection: $tags)
                ZCDateField("Fecha de entrega", iso: $date, min: "2026-01-01")
                ZCDateField("Vencimiento", iso: .constant(""), error: "Usa el formato dd/mm/aaaa con una fecha que exista.")
            }
            group("Dominio por país") {
                ZCSelect("País", options: countries, selection: Binding(get: { country }, set: { country = $0 ?? "pe" }))
                ZCMoneyField("Monto", amount: $amount, country: country, required: true)
                ZCPhoneField("Teléfono", digits: $phone, country: $dialCountry)
                ZCTaxIdField(value: $taxId, country: country)
                ZCOtpField("Código de verificación", value: $otp, hint: "Te lo enviamos por SMS")
                ZCOtpField("Código incorrecto", value: .constant("123456"), error: "El código no coincide.")
                ZCNumberField(value: $seats, min: 1, max: 10, label: "Cupos")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func group<C: View>(_ title: String, @ViewBuilder _ content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: ZCSpace.v4) {
            ZCText(title, style: ZCType.titleSm)
            content()
        }
    }
}
