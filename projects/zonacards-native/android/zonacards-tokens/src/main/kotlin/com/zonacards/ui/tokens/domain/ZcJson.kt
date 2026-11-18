package com.zonacards.ui.tokens.domain

/**
 * Lector JSON mínimo (objetos, listas, textos, números, booleanos y null) para la especificación de dominio.
 * Sin dependencias: org.json de Android no existe en las pruebas de JVM.
 */
internal object ZcJson {
    fun parse(text: String): Any? = Parser(text).run { val v = value(); ws(); require(i == s.length) { "JSON con texto sobrante en $i" }; v }

    private class Parser(val s: String) {
        var i = 0
        fun ws() { while (i < s.length && s[i].isWhitespace()) i++ }
        fun value(): Any? {
            ws()
            return when (val c = s[i]) {
                '{' -> obj()
                '[' -> arr()
                '"' -> str()
                't' -> lit("true", true)
                'f' -> lit("false", false)
                'n' -> lit("null", null)
                else -> if (c == '-' || c.isDigit()) num() else error("JSON inválido en $i: '$c'")
            }
        }
        fun lit(word: String, v: Any?): Any? { require(s.startsWith(word, i)) { "JSON inválido en $i" }; i += word.length; return v }
        fun obj(): Map<String, Any?> {
            val m = LinkedHashMap<String, Any?>(); i++; ws()
            if (s[i] == '}') { i++; return m }
            while (true) {
                ws(); val k = str(); ws(); require(s[i] == ':'); i++
                m[k] = value(); ws()
                when (s[i++]) { ',' -> continue; '}' -> return m; else -> error("Se esperaba , o } en ${i - 1}") }
            }
        }
        fun arr(): List<Any?> {
            val l = ArrayList<Any?>(); i++; ws()
            if (s[i] == ']') { i++; return l }
            while (true) {
                l.add(value()); ws()
                when (s[i++]) { ',' -> continue; ']' -> return l; else -> error("Se esperaba , o ] en ${i - 1}") }
            }
        }
        fun str(): String {
            require(s[i] == '"'); i++
            val b = StringBuilder()
            while (true) {
                val c = s[i++]
                when (c) {
                    '"' -> return b.toString()
                    '\\' -> when (val e = s[i++]) {
                        'n' -> b.append('\n'); 't' -> b.append('\t'); 'r' -> b.append('\r'); 'b' -> b.append('\b'); 'f' -> b.append('\u000C')
                        'u' -> { b.append(s.substring(i, i + 4).toInt(16).toChar()); i += 4 }
                        else -> b.append(e)
                    }
                    else -> b.append(c)
                }
            }
        }
        fun num(): Double {
            val start = i
            while (i < s.length && (s[i].isDigit() || s[i] in "+-.eE")) i++
            return s.substring(start, i).toDouble()
        }
    }
}

@Suppress("UNCHECKED_CAST")
internal fun Any?.obj(): Map<String, Any?> = this as Map<String, Any?>
@Suppress("UNCHECKED_CAST")
internal fun Any?.list(): List<Any?> = this as List<Any?>
internal fun Any?.str(): String = this as String
