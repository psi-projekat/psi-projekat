<?php
  class GiveUpFromCompetition extends Query{
    public function query($pdo, $args){
      $st = $pdo->prepare('
        select idUser as id, (
          select count(*) from Competition
          where idComp = ?
        ) as comps, (
          select count(*) from Participating
          where user = idUser and comp = ?
        ) as pars
        from User
        where token = ?
      ');
      $st->execute([$args->idComp, $args->idComp, $args->token]);
      $row = $st->fetch();
      $user = $row['id'];

      if($row === false || $row['comps'] !== 1 || $row['pars'] !== 1){
        $this->err('data');
        return;
      }

      $st = $pdo->prepare('
        select startDate
        from Competition
        where idComp = ?
      ');
      $st->execute([$args->idComp]);
      $row = $st->fetch();

      if($this->date >= $row['startDate']){
        $this->err('compStartedGiveUp');
        return;
      }

      $st = $pdo->prepare('
        delete from Participating
        where user = ? and comp = ?
      ');
      $st->execute([$user, $args->idComp]);

      $st = $pdo->prepare('
        update Competition
        set currentUsers = currentUsers - 1
        where idComp = ?
      ');
      $st->execute([
        $args->idComp,
      ]);

      $this->succ();
    }
  }

  new GiveUpFromCompetition();
?>