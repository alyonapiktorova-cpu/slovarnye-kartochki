import { NextResponse } from "next/server";

const POLZA_URL = "https://polza.ai/api/v1/media";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get("operationId");

    if (!operationId) {
      return NextResponse.json(
        { error: "Не указан operationId." },
        { status: 400 }
      );
    }

    const apiKey = process.env.POLZA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Не настроен POLZA_API_KEY." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${POLZA_URL}/${encodeURIComponent(operationId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    console.log("Polza status:", data);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            data?.message ||
            "Polza не вернула статус генерации.",
        },
        { status: response.status }
      );
    }

    if (data.status === "completed") {
      const imageUrl = Array.isArray(data?.data)
        ? data.data[0]?.url
        : data?.data?.url;

      if (!imageUrl) {
        return NextResponse.json(
          {
            error:
              "Polza сообщила о завершении, но URL изображения не найден.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: "completed",
        imageUrl,
      });
    }

    if (data.status === "failed" || data.status === "cancelled") {
      return NextResponse.json(
        {
          status: data.status,
          error:
            data?.error?.message ||
            data?.message ||
            "Генерация изображения не удалась.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: data.status,
    });
  } catch (error) {
    console.error("Polza status error:", error);

    return NextResponse.json(
      { error: "Не удалось получить статус генерации." },
      { status: 500 }
    );
  }
}