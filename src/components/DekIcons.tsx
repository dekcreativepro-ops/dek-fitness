import type { ComponentType } from 'react';
import {
  AlertTriangle,
  Award,
  Bell as LucideBell,
  Bike as LucideBike,
  Box,
  Calendar,
  CalendarCheck,
  Camera,
  CameraOff,
  Check,
  CheckCircle2,
  CircleDot,
  Clock,
  Compass as LucideCompass,
  Crown as LucideCrown,
  Droplets,
  Dumbbell as LucideDumbbell,
  Flag as LucideFlag,
  Flame,
  Footprints as LucideFootprints,
  Ghost as LucideGhost,
  Globe as LucideGlobe,
  Handshake as LucideHandshake,
  Home,
  Lock as LucideLock,
  LogOut,
  MapPin as LucideMapPin,
  Mic,
  MicOff,
  Minus as LucideMinus,
  Navigation,
  Paintbrush,
  Play as LucidePlay,
  PlayCircle as LucidePlayCircle,
  Plus as LucidePlus,
  QrCode as LucideQrCode,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck as LucideShieldCheck,
  Shuffle as LucideShuffle,
  SlidersHorizontal as LucideSlidersHorizontal,
  Sparkles,
  Star as LucideStar,
  Swords,
  ThumbsUp,
  Timer as LucideTimer,
  Trophy as LucideTrophy,
  Users as LucideUsers,
  Utensils,
  Video,
  Volume2,
  VolumeX,
  Wallet as LucideWallet,
  X as LucideX,
  Zap,
  Activity,
  ArrowRight as LucideArrowRight,
  Bookmark as LucideBookmark,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Mars,
  Pause as LucidePause,
  Repeat,
  Ruler as LucideRuler,
  Scale as LucideScale,
  Search,
  SkipBack,
  SkipForward as LucideSkipForward,
  Target as LucideTarget,
  TrendingDown,
  TrendingUp,
  Venus,
  type LucideProps,
} from 'lucide-react';

export interface DekIconProps {
  className?: string;
  weight?: 'duotone' | 'bold' | 'regular';
}

function makeDuotone(IconComp: ComponentType<LucideProps>) {
  return function DekIcon({ className, weight = 'duotone' }: DekIconProps) {
    return (
      <IconComp
        className={className}
        strokeWidth={weight === 'bold' ? 2.5 : 2.1}
        fill={weight === 'duotone' ? 'currentColor' : 'none'}
        fillOpacity={weight === 'duotone' ? 0.24 : 0}
      />
    );
  };
}

export const ArrowsClockwise = makeDuotone(RotateCcw);
export const BowlFood = makeDuotone(Utensils);
export const CalendarIcon = makeDuotone(Calendar);
export { CalendarIcon as Calendar };
export const CalendarCheckIcon = makeDuotone(CalendarCheck);
export { CalendarCheckIcon as CalendarCheck };
export const CameraIcon = makeDuotone(Camera);
export { CameraIcon as Camera };
export const CameraSlash = makeDuotone(CameraOff);
export const CheckIcon = makeDuotone(Check);
export { CheckIcon as Check };
export const CheckCircle = makeDuotone(CheckCircle2);
export const ClockIcon = makeDuotone(Clock);
export { ClockIcon as Clock };
export const Compass = makeDuotone(LucideCompass);
export const Cube = makeDuotone(Box);
export const Drop = makeDuotone(Droplets);
export const Fire = makeDuotone(Flame);
export const Globe = makeDuotone(LucideGlobe);
export const HandsClapping = makeDuotone(ThumbsUp);
export const House = makeDuotone(Home);
export const Lightning = makeDuotone(Zap);
export const Lock = makeDuotone(LucideLock);
export const MapPin = makeDuotone(LucideMapPin);
export const Medal = makeDuotone(Award);
export const Microphone = makeDuotone(Mic);
export const MicrophoneSlash = makeDuotone(MicOff);
export const Minus = makeDuotone(LucideMinus);
export const NavigationArrow = makeDuotone(Navigation);
export const PaintBrush = makeDuotone(Paintbrush);
export const PaperPlaneRight = makeDuotone(Send);
export const Play = makeDuotone(LucidePlay);
export const PlayCircle = makeDuotone(LucidePlayCircle);
export const Plus = makeDuotone(LucidePlus);
export const ShieldCheck = makeDuotone(LucideShieldCheck);
export const ShieldWarning = makeDuotone(ShieldAlert);
export const Shuffle = makeDuotone(LucideShuffle);
export const SignOut = makeDuotone(LogOut);
export const SlidersHorizontal = makeDuotone(LucideSlidersHorizontal);
export const SoccerBall = makeDuotone(CircleDot);
export const Sparkle = makeDuotone(Sparkles);
export const Star = makeDuotone(LucideStar);
export const Sword = makeDuotone(Swords);
export const Trophy = makeDuotone(LucideTrophy);
export const Users = makeDuotone(LucideUsers);
export const UsersThree = makeDuotone(LucideUsers);
export const VideoCamera = makeDuotone(Video);
export const Warning = makeDuotone(AlertTriangle);
export const X = makeDuotone(LucideX);
export const QrCode = makeDuotone(LucideQrCode);
export const Timer = makeDuotone(LucideTimer);
export const Dumbbell = makeDuotone(LucideDumbbell);
export const Flag = makeDuotone(LucideFlag);
export const Ghost = makeDuotone(LucideGhost);
export const Handshake = makeDuotone(LucideHandshake);
export const Bell = makeDuotone(LucideBell);
export const Bike = makeDuotone(LucideBike);
export const Footprints = makeDuotone(LucideFootprints);
export const Wallet = makeDuotone(LucideWallet);
export const Crown = makeDuotone(LucideCrown);
export const SpeakerHigh = makeDuotone(Volume2);
export const SpeakerSlash = makeDuotone(VolumeX);
export const CaretLeft = makeDuotone(ChevronLeft);
export const CaretRight = makeDuotone(ChevronRight);
export const BookmarkSimple = makeDuotone(LucideBookmark);
export const MagnifyingGlass = makeDuotone(Search);
export const Pause = makeDuotone(LucidePause);
export const SkipForward = makeDuotone(LucideSkipForward);
export const SkipBackward = makeDuotone(SkipBack);
export const ArrowRight = makeDuotone(LucideArrowRight);
export const GenderMale = makeDuotone(Mars);
export const GenderFemale = makeDuotone(Venus);
export const TrendUp = makeDuotone(TrendingUp);
export const TrendDown = makeDuotone(TrendingDown);
export const Target = makeDuotone(LucideTarget);
export const RulerIcon = makeDuotone(LucideRuler);
export const ScaleIcon = makeDuotone(LucideScale);
export const ListNumbers = makeDuotone(ListOrdered);
export const Pulse = makeDuotone(Activity);
export const Rounds = makeDuotone(Repeat);
