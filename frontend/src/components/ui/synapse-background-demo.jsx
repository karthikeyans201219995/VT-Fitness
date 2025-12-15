import React from 'react'
import SynapseBackground from './synapse-background'

export const SynapseBackgroundDemo = () => {
  const demoProps = {
    particleCount: 4000,
    connectionDistance: 60,
    className: 'flex items-center justify-center',
  }

  return (
    <SynapseBackground {...demoProps}>
      <div className="text-center select-none p-4">
        <h1 className="text-5xl md:text-7xl lg:text-[80px] font-bold uppercase text-white drop-shadow-[0_0_20px_rgba(0,0,0,1)] leading-none">
          Mind Canvas
        </h1>
        <h2 className="text-4xl md:text-5xl lg:text-[60px] font-medium uppercase text-white drop-shadow-[0_0_20px_rgba(0,0,0,1)] leading-none">
          Connecting Ideas
        </h2>
        <p className="mt-2 text-sm md:text-base text-white drop-shadow-[0_0_20px_rgba(0,0,0,1)]">
          Move the cursor to activate the network.
        </p>
      </div>
    </SynapseBackground>
  )
}

export default SynapseBackgroundDemo
