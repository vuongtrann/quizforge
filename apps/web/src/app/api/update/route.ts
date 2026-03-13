import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// The updater expects a 204 No Content if there's no update,
// or a JSON response if there is an update.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const currentVersion = searchParams.get("version")
  const target = searchParams.get("target")

  try {
    // Get the latest published release.
    const latestRelease = await prisma.release.findFirst({
      where: { isPublished: true },
      orderBy: { version: "desc" },
    })

    if (!latestRelease) {
      return new Response(null, { status: 204 })
    }

    // Simplistic version check (replace with semver library in real prod)
    if (currentVersion && satisfyVersion(latestRelease.version, currentVersion)) {
       // Already on latest
       return new Response(null, { status: 204 })
    }
    
    // Tauri json format
    return NextResponse.json({
      version: latestRelease.version,
      notes: latestRelease.releaseNotes || "Performance improvements and bug fixes.",
      pub_date: latestRelease.createdAt.toISOString(),
      platforms: {
        "windows-x86_64": {
          signature: latestRelease.signature,
          url: latestRelease.downloadUrl,
        }
      }
    })

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Simple semver compare. True if latest <= current
function satisfyVersion(latest: string, current: string) {
  return latest.localeCompare(current, undefined, { numeric: true, sensitivity: 'base' }) <= 0;
}
