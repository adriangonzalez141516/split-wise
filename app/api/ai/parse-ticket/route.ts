import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ticketSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    establishment: {
      type: Type.STRING,
      description: "Name of the restaurant or establishment",
    },
    date: {
      type: Type.STRING,
      description: "Date of the ticket in YYYY-MM-DD format",
    },
    currency: {
      type: Type.STRING,
      description: "Currency of the ticket, e.g., EUR, USD",
    },
    items: {
      type: Type.ARRAY,
      description: "List of items consumed",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique random string ID for this item" },
          name: { type: Type.STRING, description: "Name of the dish or drink" },
          quantity: { type: Type.NUMBER, description: "Number of units ordered" },
          unit_price: { type: Type.NUMBER, description: "Price per unit" },
          total_price: { type: Type.NUMBER, description: "Total price for the quantity" },
          category: {
            type: Type.STRING,
            enum: ['food', 'standard_drink', 'alcohol', 'dessert', 'service'],
            description: "Category of the item",
          },
        },
        required: ["id", "name", "quantity", "unit_price", "total_price", "category"],
      },
    },
    global_modifiers: {
      type: Type.OBJECT,
      properties: {
        tax_amount: { type: Type.NUMBER, description: "Total taxes" },
        service_charge: { type: Type.NUMBER, description: "Service charges if any" },
        discount_amount: { type: Type.NUMBER, description: "Discounts applied" },
        tip_amount: { type: Type.NUMBER, description: "Tip amount left" },
      },
      description: "Global amounts added or subtracted to the ticket items",
    },
    total_amount: { type: Type.NUMBER, description: "Total amount stated in the ticket" },
  },
  required: ["establishment", "date", "currency", "items", "global_modifiers", "total_amount"],
};

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      return NextResponse.json({ success: false, error: 'Expected JSON with base64 images' }, { status: 400 });
    }

    const images = body.images as string[];
    if (!images || images.length === 0) {
      return NextResponse.json({ success: false, error: 'No images provided' }, { status: 400 });
    }

    // Convert WebP base64 data to GenAI inlineData format
    const inlineDataImages = images.map((base64Str) => {
      // The format from canvas is data:image/webp;base64,....
      const parts = base64Str.split(',');
      const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/webp';
      const data = parts[1];
      return {
        inlineData: {
          data,
          mimeType,
        },
      };
    });

    // Call Gemini with multi-model fallback mechanism
    let response;
    const aiConfig = {
      contents: [
        "Extrae la información de este ticket de restaurante con máxima precisión. Desglosa todos los platos y bebidas.",
        ...inlineDataImages
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: ticketSchema,
        temperature: 0.1,
      },
    };

    const modelos = [
      "gemini-3.6-flash",
      "gemini-3.5-flash"
    ];

    let exito = false;
    for (let i = 0; i < modelos.length; i++) {
      if (exito) break;
      
      const maxRetries = 2;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: modelos[i],
            ...aiConfig,
          });
          exito = true;
          break; // Éxito: rompe el bucle de reintentos
        } catch (error: any) {
          const is503 = error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('high demand') || error?.message?.includes('UNAVAILABLE');
          
          if (is503) {
            if (attempt < maxRetries - 1) {
              console.warn(`[Aviso] ${modelos[i]} saturado (intento ${attempt + 1}). Esperando 1s para reintentar...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue; // Reintenta el mismo modelo
            } else {
              console.warn(`[Caída] ${modelos[i]} saturado tras ${maxRetries} intentos. Pasando al siguiente modelo...`);
              break; // Rompe el bucle de intentos, el bucle exterior avanza al siguiente modelo
            }
          }
          throw error; // Si el error no es 503, rompe todo y devuelve el error al frontend
        }
      }
    }

    if (!exito || !response) {
      throw new Error("Todos los modelos están saturados en este momento. Por favor, inténtalo más tarde.");
    }

    const parsedText = response.text;
    if (!parsedText) {
      throw new Error("No text returned by the model");
    }

    const parsedTicket = JSON.parse(parsedText);

    // Calculate sum of item totals + global modifiers
    const sumItems = parsedTicket.items.reduce((acc: number, item: any) => acc + item.total_price, 0);
    const sumModifiers =
      (parsedTicket.global_modifiers.tax_amount || 0) +
      (parsedTicket.global_modifiers.service_charge || 0) +
      (parsedTicket.global_modifiers.tip_amount || 0) -
      (parsedTicket.global_modifiers.discount_amount || 0);

    const calculatedTotal = Math.round((sumItems + sumModifiers) * 100) / 100;
    const discrepancy = Math.abs(calculatedTotal - parsedTicket.total_amount);
    const isIntegrityValid = discrepancy <= 0.01;

    return NextResponse.json({
      success: true,
      data: parsedTicket,
      integrity: {
        isValid: isIntegrityValid,
        calculatedTotal,
        statedTotal: parsedTicket.total_amount,
        discrepancy: Math.round(discrepancy * 100) / 100,
        warning: !isIntegrityValid ? 'Discrepancia detectada mayor a 0.01 €. Requiere ajuste manual.' : null,
      },
    });
  } catch (error: any) {
    console.error('Error in parse-ticket:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al procesar el ticket con IA' },
      { status: 500 }
    );
  }
}
