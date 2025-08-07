import React from 'react'
import Home from '../assets/home.png'
import Search from '../assets/search.png'
import '../App.css'
export default function Nav () {
  return (
    <div className='flex mt-3'>
      <img src={Home} height={40} width={40} className='ursor-pointer' />
      <div className='w-[40%] h-10 bg-gray-700 rounded-full flex items-center ml-4 hover:bg-gray-600 focus:bg-gray-500 transition-all focus:outine-white'>
        <img
          src={Search}
          height={30}
          width={30}
          className='cursor-pointer ml-2'
        />
        <input
          type='text'
          placeholder='What do you want to listen to?'
          className='bg-transparent outline-none text-white w-full ml-2 noto'
        />
      </div>
    </div>
  )
}
