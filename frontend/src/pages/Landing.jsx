// ════════════════════════════════════════════════════════════════
// FILE: pages/Landing.jsx
// PURPOSE: Public landing page for AstraAgent. Features a full-
//          screen 3D particle animation (fibonacci sphere on
//          canvas) with mouse parallax, hero typography, footer
//          stats, and a "Sign In" CTA linking to /login.
// EXPORTS: Landing (default)
// DEPENDS ON: react-router-dom, lucide-react
// ════════════════════════════════════════════════════════════════
import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function Landing() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    let W, H, DPR
    let animationFrameId

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      cvs.width = W * DPR
      cvs.height = H * DPR
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    window.addEventListener('resize', resize)
    resize()

    // Build a neural sculpture: points on a distorted torus/sphere field
    /**
     * Generates a fibonacci sphere (evenly distributed points on a sphere).
     * Calculates the spherical coordinates and stores random properties 
     * (p for phase, sp for speed) for the animation loop.
     */
    const N = 2600
    const pts = []
    for (let i = 0; i < N; i++) {
      // fibonacci sphere
      const t = i / N
      const phi = Math.acos(1 - 2 * t)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      let x = Math.sin(phi) * Math.cos(theta)
      let y = Math.sin(phi) * Math.sin(theta)
      let z = Math.cos(phi)
      pts.push({ x, y, z, p: Math.random() * Math.PI * 2, sp: 0.4 + Math.random() * 0.8 })
    }

    let rot = 0
    const mouse = { x: 0, y: 0 }

    const handleMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5)
      mouse.y = (e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('mousemove', handleMouseMove)

    /**
     * Main 3D animation loop.
     * Computes the new projected X/Y coordinates using 3D rotation math
     * and a traveling sine/cosine wave distortion to give it a "neural" look.
     * Elements are sorted by depth (Z-index) to draw back-to-front.
     */
    function loop(time) {
      ctx.clearRect(0, 0, W, H)
      const cx = W * 0.5
      const cy = H * 0.46
      const R = Math.min(W, H) * 0.34
      rot += 0.0016
      const ry = rot + mouse.x * 0.6
      const rx = mouse.y * 0.4
      const tnow = time * 0.001

      const proj = []
      for (const p of pts) {
        // distortion: warp the field with travelling waves
        const warp = 1 + 0.16 * Math.sin(p.p + tnow * p.sp) + 0.10 * Math.cos(p.y * 3 + tnow * 0.6)
        let x = p.x * warp, y = p.y * warp, z = p.z * warp
        // rotate Y
        let cosY = Math.cos(ry), sinY = Math.sin(ry)
        let x1 = x * cosY - z * sinY
        let z1 = x * sinY + z * cosY
        // rotate X
        let cosX = Math.cos(rx), sinX = Math.sin(rx)
        let y1 = y * cosX - z1 * sinX
        let z2 = y * sinX + z1 * cosX
        const persp = 1 / (2.2 - z2)
        proj.push({ sx: cx + x1 * R * persp * 1.6, sy: cy + y1 * R * persp * 1.6, z: z2, persp })
      }
      proj.sort((a, b) => a.z - b.z)

      for (const q of proj) {
        const depth = (q.z + 1.4) / 2.8 // 0..1
        const size = q.persp * 1.9 * (0.4 + depth)
        const alpha = Math.max(0, Math.min(1, 0.12 + depth * 0.85))
        ctx.beginPath()
        ctx.arc(q.sx, q.sy, Math.max(0.4, size), 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')'
        ctx.fill()
        // subtle glow on front particles
        if (depth > 0.8) {
          ctx.beginPath()
          ctx.arc(q.sx, q.sy, size * 2.4, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,' + (alpha * 0.06) + ')'
          ctx.fill()
        }
      }
      animationFrameId = requestAnimationFrame(loop)
    }
    animationFrameId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-[#f4f3f0] font-sans">
      {/* Visual Effects */}
      <div className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(ellipse_80%_70%_at_50%_42%,rgba(0,0,0,0)_30%,rgba(0,0,0,0.55)_78%,#000_100%)]"></div>
      <div 
        className="pointer-events-none absolute inset-0 z-40 mix-blend-multiply opacity-50"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,.22) 3px, rgba(0,0,0,0) 4px)'
        }}
      ></div>
      <div className="pointer-events-none absolute left-1/2 top-[46%] z-[4] h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_35%,rgba(0,0,0,0)_65%)]"></div>
      
      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-[5] block"></canvas>

      {/* Content Frame */}
      <div className="relative z-30 flex h-full w-full flex-col p-8 md:p-14">
        
        {/* Top Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[rgba(244,243,240,0.14)]">
              <div className="h-[14px] w-[14px] rounded-full bg-[#f4f3f0] shadow-[0_0_18px_2px_rgba(255,255,255,0.55)]"></div>
            </div>
            <div>
              <div className="font-serif text-[22px] tracking-[0.32em]">ASTRA</div>
              <div className="mt-1 text-[9.5px] uppercase tracking-[0.42em] text-[#7d7c78]">Agentic Architecture</div>
            </div>
          </div>
          
          <nav className="hidden gap-10 md:flex">
            <a href="#" className="text-[11px] uppercase tracking-[0.22em] text-[#7d7c78] transition-colors hover:text-[#f4f3f0]">Platform</a>
            <a href="#" className="text-[11px] uppercase tracking-[0.22em] text-[#7d7c78] transition-colors hover:text-[#f4f3f0]">Use Cases</a>
            <a href="#" className="text-[11px] uppercase tracking-[0.22em] text-[#7d7c78] transition-colors hover:text-[#f4f3f0]">Enterprise</a>
          </nav>
          
          <Link to="/login" className="flex items-center gap-2 rounded-full border border-[rgba(244,243,240,0.14)] bg-[rgba(255,255,255,0.02)] px-6 py-2.5 text-[11px] uppercase tracking-[0.22em] text-[#f4f3f0] transition-colors hover:bg-[#f4f3f0] hover:text-black">
            Sign In <ArrowRight className="h-3 w-3" />
          </Link>
        </header>

        {/* Hero Section */}
        <section className="pointer-events-none flex flex-1 flex-col justify-center">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-[54px] bg-[rgba(244,243,240,0.14)]"></span>
            <span className="text-[10.5px] uppercase tracking-[0.4em] text-[#7d7c78]">Agentic Workspace</span>
          </div>
          <h1 className="max-w-[14ch] font-serif text-[clamp(62px,9vw,128px)] font-normal leading-[0.92] tracking-[-0.02em] drop-shadow-[0_0_60px_rgba(0,0,0,0.9)]">
            The shape of<br /><em className="text-[#cfcdc7] italic">thought,</em> rendered<br />in pure form.
          </h1>
          <p className="pointer-events-auto mt-8 max-w-[46ch] text-[15px] font-light leading-[1.7] text-[#b6b5b0]">
            AstraAgent orchestrates deep autonomous reasoning — where millions of parameters condense into structure, and computation becomes something you can almost see.
          </p>
        </section>

        {/* Footer Stats */}
        <div className="flex items-end justify-between border-t border-[rgba(244,243,240,0.14)] pt-5">
          <div className="flex flex-wrap gap-8 md:gap-14">
            <div className="flex flex-col">
              <div className="font-serif text-[30px] tracking-[0.01em]">200ms</div>
              <div className="mt-1.5 text-[9.5px] uppercase tracking-[0.28em] text-[#7d7c78]">Reasoning Latency</div>
            </div>
            <div className="flex flex-col">
              <div className="font-serif text-[30px] tracking-[0.01em]">ReAct</div>
              <div className="mt-1.5 text-[9.5px] uppercase tracking-[0.28em] text-[#7d7c78]">Orchestration Engine</div>
            </div>
            <div className="flex flex-col">
              <div className="font-serif text-[30px] tracking-[0.01em]">SQLite</div>
              <div className="mt-1.5 text-[9.5px] uppercase tracking-[0.28em] text-[#7d7c78]">Persistent Memory</div>
            </div>
          </div>
          
          <div className="flex animate-pulse items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-[#7d7c78]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f4f3f0]"></span>
            System Online
          </div>
        </div>
      </div>
    </div>
  )
}
