import asyncio
import hashlib
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont

from imagen_construct.ports.generation_adapter import (
    AdapterCapabilities,
    GenerateImageRequest,
    GeneratedImage,
)


class MockGenerationAdapter:
    """Deterministic adapter used to validate the complete product workflow without a GPU."""

    id = "mock-rgba"

    def capabilities(self) -> AdapterCapabilities:
        return {
            "id": self.id,
            "name": "Mock RGBA generator",
            "textToImage": True,
            "transparentOutput": True,
            "deterministic": True,
            "cancellable": True,
        }

    async def generate(self, request: GenerateImageRequest) -> GeneratedImage:
        await asyncio.sleep(0.15)

        digest = hashlib.sha256(f"{request.seed}:{request.prompt}".encode()).digest()
        primary = (digest[0], digest[1], digest[2], 235)
        secondary = (digest[3], digest[4], digest[5], 210)
        accent = (digest[6], digest[7], digest[8], 245)

        image = Image.new("RGBA", (request.width, request.height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image, "RGBA")
        margin = max(12, min(request.width, request.height) // 12)
        body = (
            margin,
            request.height // 3,
            request.width - margin,
            request.height - margin,
        )
        radius = max(10, min(request.width, request.height) // 12)

        draw.rounded_rectangle(body, radius=radius, fill=primary)
        draw.ellipse(
            (
                request.width // 5,
                request.height // 6,
                request.width // 2,
                request.height // 2,
            ),
            fill=secondary,
        )
        draw.rounded_rectangle(
            (
                request.width // 2,
                request.height // 5,
                request.width - request.width // 8,
                request.height // 2,
            ),
            radius=radius // 2,
            fill=accent,
        )

        label = request.prompt.strip()[:40] or "Generated layer"
        font = ImageFont.load_default()
        text_box = draw.textbbox((0, 0), label, font=font)
        text_width = text_box[2] - text_box[0]
        text_height = text_box[3] - text_box[1]
        label_padding = 8
        label_x = max(margin, (request.width - text_width) // 2)
        label_y = request.height - margin - text_height - label_padding * 2
        draw.rounded_rectangle(
            (
                label_x - label_padding,
                label_y - label_padding,
                label_x + text_width + label_padding,
                label_y + text_height + label_padding,
            ),
            radius=6,
            fill=(12, 16, 22, 215),
        )
        draw.text((label_x, label_y), label, fill=(255, 255, 255, 255), font=font)

        output = BytesIO()
        image.save(output, format="PNG", optimize=True)
        return GeneratedImage(
            payload=output.getvalue(),
            model_id="mock-pillow-v1",
            workflow_id="mock-rgba-shapes-v1",
            seed=request.seed,
        )
