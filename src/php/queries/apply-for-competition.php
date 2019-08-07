<?php
  class ApplyForCompetition extends Query{
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

      if($row === false || $row['comps'] !== 1 || $row['pars'] !== 0){
        $this->err('data');
        return;
      }

      $st = $pdo->prepare('
        select startDate, maxUsers, currentUsers
        from Competition
        where idComp = ?
      ');
      $st->execute([$args->idComp]);
      $row = $st->fetch();

      if($this->date >= $row['startDate']){
        $this->err('compStartedApply');
        return;
      }

      if($row['currentUsers'] === $row['maxUsers']){
        $this->err('compFull');
        return;
      }

      $st = $pdo->prepare('
        insert into Participating (
          user,
          comp,
          lang,
          script,
          applicationDate
        ) value (?, ?, ?, ?, ?)
      ');
      $st->execute([
        $user,
        $args->idComp,
        $args->lang,
        $args->script,
        $this->date,
      ]);

      $st = $pdo->prepare('
        update Competition
        set currentUsers = currentUsers + 1
        where idComp = ?
      ');
      $st->execute([
        $args->idComp,
      ]);

      $this->succ();
    }
  }

  new ApplyForCompetition();
?>