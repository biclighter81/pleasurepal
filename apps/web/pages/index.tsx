import BlobTop from '@/components/blob/BlobTop';
import ButtonBlob from '@/components/blob/ButtonBlob';
import useSWR from 'swr';
import {
  IconActivityHeartbeat,
  IconBrandDiscord,
  IconFlame,
  IconHeartHandshake,
} from '@tabler/icons-react';
import Button from '../components/app/interaction/Button';
import { FetcherError, fetcher } from '@/lib/fetcher';
import { FriendRequest } from '@/lib/types/friend';

export default function Home() {
  const { data, error, isLoading } = useSWR<FriendRequest[], FetcherError>(
    'friends/requests',
    fetcher
  );
  return (
    <>
      <BlobTop />
      <div className='flex flex-col lg:flex-row lg:justify-start items-center'>
        {/* small device pleasurepal header */}
        <div className='w-full flex justify-center lg:hidden mt-12'>
          <div className='mb-8 flex flex-col w-fit'>
            <h1 className='text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-400 uppercase'>
              Pleasurepal
            </h1>
            <h3 className='uppercase font-semibold -mt-1'>
              The future of online dating
            </h3>
          </div>
        </div>
        <div className='w-full lg:w-fit flex justify-center sm:justify-start'>
          <ButtonBlob />
        </div>
        <div className='flex flex-col justify-center'>
          <div className='mb-8 mt-8 hidden lg:block'>
            <h1 className='text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-400 uppercase'>
              Pleasurepal
            </h1>
            <h3 className='uppercase font-semibold -mt-1'>
              The future of online dating
            </h3>
          </div>
          <div className='h-2/3 flex space-x-4 md:pr-20 pt-20 lg:pt-0 px-10 lg:px-0 lg:max-w-2xl'>
            <div>
              <h2 className='uppercase font-black text-4xl'>Our Philosophy</h2>
              <span className='uppercase font-semibold'>What we think!</span>
              <div className='w-1/3 h-[3px] bg-white mt-1'></div>
              <p className='mb-8 mt-4 text-sm font-light'>
                Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
                diam nonumy eirmod tempor invidunt ut labore et dolore magna
                aliquyam erat, sed diam voluptua. At vero eos et accusam et
                justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea
                takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum
                dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
                eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
                sed diam voluptua. At vero eos et accusam et justo duo dolores
                et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus
                est Lorem ipsum dolor sit amet.
              </p>
              <div className='flex sm:space-x-4 sm:space-y-0 space-y-4 flex-col sm:flex-row'>
                <Button theme='white' text='More About' />
                <Button
                  theme='primary-gradient'
                  text='Join Discord'
                  icon={<IconBrandDiscord className='h-4 w-4' />}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Our Platfrom section */}
      <div className='mx-10 my-24'>
        <div className='mb-8'>
          <h1 className='uppercase font-black text-5xl'>Our Platform</h1>
          <h3 className='uppercase font-semibold -mt-1'>What we offer you!</h3>
          <div className='w-32 h-[4px] bg-white' />
        </div>
        <div className='grid grid-rows-3 xl:grid-rows-1 grid-cols-1 xl:grid-cols-3 xl:gap-32 gap-12'>
          <div className='rounded-2xl bg-gradient-to-br from-[#BE6AFF] to-[#DA45DD] min-h-[250px] w-full flex flex-col py-8 px-8 items-center h-fit'>
            <IconHeartHandshake
              className='w-16 h-16 text-white'
              strokeWidth={2}
            />
            <h2 className='uppercase font-black text-3xl mt-4'>Community</h2>
            <div className='bg-white w-1/2 h-[4px] my-1' />
            <p className='text-center mt-8 text-sm'>
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
              nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
              erat, sed diam voluptua.
            </p>
            <div className='mt-8'>
              <Button theme='white' text='Explore' href='#' />
            </div>
          </div>
          <div className='rounded-2xl bg-gradient-to-br from-[#BE6AFF] to-[#DA45DD] min-h-[250px] w-full flex flex-col py-8 px-8 items-center h-fit'>
            <IconFlame className='w-16 h-16 text-white' strokeWidth={2} />
            <h2 className='uppercase font-black text-3xl mt-4'>Matchmaking</h2>
            <div className='bg-white w-1/2 h-[4px] my-1' />
            <p className='text-center mt-8 text-sm'>
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
              nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
              erat, sed diam voluptua.
            </p>
            <div className='mt-8'>
              <Button theme='white' text='Explore' href='/matchmaking' />
            </div>
          </div>
          <div className='rounded-2xl bg-gradient-to-br from-[#BE6AFF] to-[#DA45DD] min-h-[250px] w-full flex flex-col py-8 px-8 items-center h-fit'>
            <IconActivityHeartbeat
              className='w-16 h-16 text-white'
              strokeWidth={2}
            />
            <h2 className='uppercase font-black text-3xl mt-4'>Editor</h2>
            <div className='bg-white w-1/2 h-[4px] my-1' />
            <p className='text-center text-sm mt-8'>
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
              nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
              erat, sed diam voluptua.
            </p>
            <div className='mt-8'>
              <Button theme='white' text='Explore' href='/editor' />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
