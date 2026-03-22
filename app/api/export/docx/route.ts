import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export async function POST(req: Request) {
  try {
    const { title, sections } = await req.json();

    const docChildren = [
      new Paragraph({
        text: title || "AI Planning Report",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: "" }), // Spacing
    ];

    sections.forEach((section: any) => {
      docChildren.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
      
      // Ensure content is a string before splitting to prevent 500 errors on undefined or object types
      const safeContent = section.content ? (typeof section.content === 'string' ? section.content : JSON.stringify(section.content)) : "";
      const contentParams = safeContent.split('\n').filter((p: string) => p.trim() !== '');
      contentParams.forEach((pText: string) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: pText,
                size: 24, // 12pt
              }),
            ],
            spacing: { after: 120 },
          })
        );
      });
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8Array = new Uint8Array(buffer);

    return new Response(uint8Array, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="report.docx"',
      },
    });
  } catch (error: any) {
    console.error("Error in /api/export/docx:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate DOCX" },
      { status: 500 }
    );
  }
}
